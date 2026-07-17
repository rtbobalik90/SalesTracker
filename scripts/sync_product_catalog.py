#!/usr/bin/env python3
"""Build product-catalog.json from configured Triple Crown product/category URLs.

This crawler is intentionally source-list driven. Add product pages to
catalog-product-urls.txt or category/listing pages to catalog-category-urls.txt.
It does not use customer data or the tracker Gist.
"""
from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PRODUCT_URLS = ROOT / "catalog-product-urls.txt"
CATEGORY_URLS = ROOT / "catalog-category-urls.txt"
OUTPUT = ROOT / "product-catalog.json"
USER_AGENT = "TripleCrownProducts-CatalogSync/1.0 (+company-internal GitHub Action)"
TIMEOUT = 35
DELAY = 0.5

session = requests.Session()
session.headers.update({"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"})


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def read_urls(path: Path) -> list[str]:
    if not path.exists():
        return []
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]


def unique(values: list[Any]) -> list[Any]:
    seen: set[str] = set()
    output: list[Any] = []
    for value in values:
        key = clean(value if isinstance(value, str) else json.dumps(value, sort_keys=True))
        if not key or key.lower() in seen:
            continue
        seen.add(key.lower())
        output.append(value)
    return output


def get(url: str) -> str:
    response = session.get(url, timeout=TIMEOUT)
    response.raise_for_status()
    time.sleep(DELAY)
    return response.text


def discover_product_urls(category_urls: list[str]) -> list[str]:
    discovered: list[str] = []
    for category_url in category_urls:
        try:
            soup = BeautifulSoup(get(category_url), "html.parser")
            for anchor in soup.select('a[href*="/product/"]'):
                discovered.append(urljoin(category_url, anchor.get("href", "")))
        except Exception as exc:
            print(f"WARNING category {category_url}: {exc}")
    return unique(discovered)


def json_ld_products(soup: BeautifulSoup) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            value = json.loads(script.get_text(strip=True))
        except Exception:
            continue
        entries = value.get("@graph", []) if isinstance(value, dict) and "@graph" in value else value
        if not isinstance(entries, list):
            entries = [entries]
        for item in entries:
            if isinstance(item, dict) and "product" in str(item.get("@type", "")).lower():
                results.append(item)
    return results


def parse_pricing(text: str) -> list[dict[str, Any]]:
    match = re.search(r"Pricing:\s*(.*?)(?:sizes:|Available Logo Types)", text, re.I | re.S)
    if not match:
        return []
    lines = [clean(line) for line in match.group(1).splitlines() if clean(line)]
    tiers: list[dict[str, Any]] = []
    index = 0
    while index < len(lines) - 1:
        label, price_text = lines[index], lines[index + 1]
        if re.match(r"^\d", label) and re.match(r"^\$[\d,.]+$", price_text):
            numbers = [int(x) for x in re.findall(r"\d+", label)]
            tiers.append(
                {
                    "label": label,
                    "min": numbers[0] if numbers else 0,
                    "max": numbers[1] if len(numbers) > 1 else None,
                    "price": float(price_text.replace("$", "").replace(",", "")),
                }
            )
            index += 2
        else:
            index += 1
    return tiers


def parse_product(url: str) -> dict[str, Any]:
    html = get(url)
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text("\n", strip=True)
    schema = (json_ld_products(soup) or [{}])[0]

    h1 = soup.find("h1")
    title = clean(schema.get("name") or (h1.get_text(" ", strip=True) if h1 else ""))
    brand = clean((schema.get("brand") or {}).get("name") if isinstance(schema.get("brand"), dict) else schema.get("brand"))
    if not brand and re.search(r"\sby\s", title, re.I):
        title, brand = [clean(x) for x in re.split(r"\sby\s", title, maxsplit=1, flags=re.I)]

    style_match = re.search(r"Item\s*#\s*([^\n\r]+)", text, re.I)
    style = clean(schema.get("sku") or (style_match.group(1) if style_match else ""))

    description = clean(schema.get("description"))
    if not description:
        desc_match = re.search(r"Item Description:\s*(.*?)(?:Pricing:|sizes:|Available Logo Types)", text, re.I | re.S)
        description = clean(desc_match.group(1) if desc_match else "")

    images: list[str] = []
    schema_images = schema.get("image", [])
    if isinstance(schema_images, str):
        schema_images = [schema_images]
    for image in schema_images or []:
        images.append(image if isinstance(image, str) else clean(image.get("url")))
    og = soup.select_one('meta[property="og:image"]')
    if og and og.get("content"):
        images.append(urljoin(url, og["content"]))
    for image in soup.find_all("img"):
        alt = clean(image.get("alt"))
        if re.match(r"^(product|thumbnail)", alt, re.I):
            src = image.get("data-src") or image.get("src")
            if src:
                images.append(urljoin(url, src))

    colors: list[dict[str, str]] = []
    for image in soup.find_all("img"):
        alt = clean(image.get("alt"))
        match = re.match(r"(.+?)\s+color option$", alt, re.I)
        if match:
            src = image.get("data-src") or image.get("src") or ""
            colors.append({"name": clean(match.group(1)), "image": urljoin(url, src) if src else ""})

    size_match = re.search(r"sizes:\s*(.*?)(?:Available Logo Types|Add To Cart)", text, re.I | re.S)
    sizes = [clean(x) for x in (size_match.group(1).splitlines() if size_match else []) if clean(x)][:30]

    methods: list[str] = []
    for name, pattern in [
        ("Screen Print", r"screen print"),
        ("Embroidery", r"embroidered logo|embroidery"),
        ("3D Embroidery", r"3d embroidered"),
        ("Embroidered Patch", r"embroidered patch"),
        ("Heat Transfer", r"heat transfer"),
        ("Embroidered Name", r"embroidered name"),
    ]:
        if re.search(pattern, text, re.I):
            methods.append(name)

    tiers = parse_pricing(text)
    lowest = min((tier["price"] for tier in tiers), default=0)

    return {
        "id": f"web-{re.sub(r'[^a-z0-9]+', '-', style.lower()).strip('-') or abs(hash(url))}",
        "style": style,
        "aliases": [style] if style else [],
        "brand": brand,
        "name": title,
        "category": "",
        "description": description,
        "url": url,
        "images": unique([x for x in images if x]),
        "colors": unique(colors),
        "sizes": unique(sizes),
        "decorationMethods": unique(methods),
        "priceTiers": tiers,
        "asLowAs": lowest,
        "minimumQuantity": tiers[0]["min"] if tiers else 0,
        "productionTime": "",
        "active": True,
        "sourceUpdatedAt": datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    urls = read_urls(PRODUCT_URLS)
    urls.extend(discover_product_urls(read_urls(CATEGORY_URLS)))
    urls = unique(urls)
    products: list[dict[str, Any]] = []
    failures = 0
    for index, url in enumerate(urls, start=1):
        try:
            print(f"[{index}/{len(urls)}] {url}")
            products.append(parse_product(url))
        except Exception as exc:
            failures += 1
            print(f"WARNING product {url}: {exc}")

    catalog = {
        "version": "tcp-product-catalog-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "Triple Crown Products website · GitHub Actions catalog sync",
        "products": products,
    }
    OUTPUT.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(products)} products to {OUTPUT}; {failures} failures.")


if __name__ == "__main__":
    main()
