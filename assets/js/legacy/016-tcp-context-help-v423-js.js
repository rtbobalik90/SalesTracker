
(function(){
  if(window.TCP_CONTEXT_HELP_V423)return;
  window.TCP_CONTEXT_HELP_V423=true;
  var REG = {"dash": {"title": "Dashboard", "summary": "Executive weekly command center for the selected tracker week. It rolls up sales, pace, forecast, production, coaching signals, quality issues, manager notes, and weekly momentum into one leadership view.", "sections": [{"title": "Executive hero / week context", "keys": ["weekly executive", "dashboard", "sales tracker", "hero"], "shows": "Selected year, quarter, month, and tracker week context plus top-level command actions.", "pulls": "Top-bar tracker selectors, fiscal week helpers, S.data weekly sales records, S.goals, and current date context."}, {"title": "Current State of the Business", "keys": ["current state", "quarter health", "business health"], "shows": "Quarter health signals, pace indicators, and key sales/account activity summaries for the selected quarter/week.", "pulls": "S.data weekly revenue/calls/coverage, S.goals, active reps, and current quarter/week helpers."}, {"title": "Team Pace Center", "keys": ["team pace", "team management"], "shows": "Rep/team progress against goals and weekly pace.", "pulls": "S.data by rep/week, S.goals by rep/quarter, active rep roster, and current quarter elapsed-week calculations."}, {"title": "Forecast Center", "keys": ["forecast center", "forecast"], "shows": "Projected finish, gap, confidence, and forecast direction.", "pulls": "Current-quarter sales history from S.data, rep/team goals from S.goals, and forecast calculation functions."}, {"title": "Strategic Watchlist", "keys": ["strategic watchlist", "management intelligence"], "shows": "Management-level risks, opportunities, and weekly business signals.", "pulls": "Derived signals from sales pace, coverage, forecast, quality logs, HR notes, and production status."}, {"title": "Production Pulse", "keys": ["production pulse", "production"], "shows": "Open production or operational items that may affect sales execution.", "pulls": "Production intelligence/project data, weekly project notes, and configured production status feeds."}, {"title": "Manager Notes", "keys": ["manager notes", "historical memory"], "shows": "Week-specific leadership notes and historical memory for the current context.", "pulls": "Saved manager/coaching notes in localStorage-backed tracker state."}, {"title": "Positive Momentum", "keys": ["positive momentum", "wins board"], "shows": "Wins, high performers, and positive callouts for the selected week.", "pulls": "Weekly sales data, performance notes, review activity, and derived momentum signals."}]}, "year": {"title": "Year Overview", "summary": "Annual command view that groups all tracker activity across the selected year.", "sections": [{"title": "Year score grid", "keys": ["score grid", "executive year view"], "shows": "Annual KPI cards for revenue, quality, coverage, calls, and overall performance.", "pulls": "All S.data records in the selected year plus goals, credit memos, art errors, and report history."}, {"title": "Year at a glance", "keys": ["year at a glance", "quarter map"], "shows": "Quarter-by-quarter annual snapshot.", "pulls": "Weekly S.data grouped into fiscal quarters."}, {"title": "Monthly revenue trend", "keys": ["monthly revenue trend", "trend"], "shows": "Sales trend by month for the selected year.", "pulls": "S.data weekly revenue grouped by calendar/fiscal month."}, {"title": "Year-to-date team leaders", "keys": ["year-to-date team leaders", "team performance"], "shows": "Top reps and team leaders for the selected year.", "pulls": "Rep-level revenue and activity totals from S.data."}, {"title": "Annual health signals", "keys": ["annual health signals", "health"], "shows": "Business risks and strengths across the year.", "pulls": "Derived annual pace, quality, production, and activity signals."}, {"title": "Year notes", "keys": ["year notes", "records"], "shows": "Saved year-level management notes.", "pulls": "Year note field stored in localStorage-backed state."}]}, "entry": {"title": "Data Entry", "summary": "Administrative input center for weekly sales, calls, goals, set sizes, roster, backups, and tracker storage.", "sections": [{"title": "Weekly sales entry", "keys": ["weekly sales", "data entry", "sales entry"], "shows": "Weekly revenue, calls, account coverage, SMB/CORP values, and rep activity inputs.", "pulls": "Writes to S.data for the selected year/quarter/week; reads active reps, set sizes, and goals."}, {"title": "Goals table", "keys": ["goals", "goal"], "shows": "Quarter goals by rep and team.", "pulls": "Reads/writes S.goals and team goal configuration."}, {"title": "Rep roster / set sizes", "keys": ["rep", "roster", "set size"], "shows": "Current reps, active status, and account set-size inputs.", "pulls": "Reads/writes S.reps profile and set-size fields."}, {"title": "Data tools", "keys": ["backup", "import", "export", "storage", "admin"], "shows": "Backup, import/export, storage health, and API/configuration controls.", "pulls": "localStorage tracker state, exported JSON, optional API/proxy settings."}]}, "profiles": {"title": "Rep Profiles", "summary": "Rep profile and individual history center. It combines profile fields, goals, quarterly pace, notes, HR events, and sales history.", "sections": [{"title": "Rep selector cards", "keys": ["rep cards", "rep profiles"], "shows": "Selectable active reps and profile role labels.", "pulls": "S.reps roster, profile photos, role/team flags, and active status."}, {"title": "Profile hero", "keys": ["profile hero", "profile"], "shows": "Selected rep photo, name, role, tenure, and quick profile actions.", "pulls": "S.reps profile fields and localStorage photo cache."}, {"title": "Quarter progress", "keys": ["quarter progress", "pace"], "shows": "Selected rep progress toward revenue/call/coverage goals.", "pulls": "S.data for selected rep/quarter and S.goals."}, {"title": "Profile details", "keys": ["details", "info"], "shows": "Editable rep information such as hire date, birthday, favorites, and custom fields.", "pulls": "S.reps profile object."}, {"title": "Notes and timeline", "keys": ["timeline", "feed", "notes"], "shows": "Recent coaching notes, HR notes, sales/quality events, and history.", "pulls": "S.coachingNotes, S.hrViolations, S.cms, S.artErrors, and S.data."}]}, "hr": {"title": "HR & Notes", "summary": "Documentation hub for HR events, coaching notes, warnings, observations, and team documentation history.", "sections": [{"title": "HR entry", "keys": ["hr entry", "document"], "shows": "Form to log HR events by rep, date, type, level, and notes.", "pulls": "Writes to S.hrViolations; reads active rep roster."}, {"title": "Manager / coaching note entry", "keys": ["coaching", "manager note", "note entry"], "shows": "Form to save observations, coaching notes, positives, concerns, and PIP notes.", "pulls": "Writes to S.coachingNotes; reads active rep roster and note-type selections."}, {"title": "HR log", "keys": ["hr log", "violations"], "shows": "Filtered history of documented HR events.", "pulls": "S.hrViolations filtered by rep/date/type."}, {"title": "Notes log", "keys": ["notes log", "coaching log"], "shows": "Filtered history of manager and coaching notes.", "pulls": "S.coachingNotes filtered by rep/date/type."}, {"title": "Summary by rep", "keys": ["summary by rep", "summary"], "shows": "Rollup of HR and coaching activity by rep.", "pulls": "S.hrViolations and S.coachingNotes grouped by rep."}]}, "credits": {"title": "Credit Memos", "summary": "Quality and credit memo command center for importing, reviewing, classifying, and analyzing credit memo impact.", "sections": [{"title": "Upload / scan credit memos", "keys": ["upload", "scan", "credit memo"], "shows": "Credit memo import/drop zone and extracted memo preview.", "pulls": "Uploaded files/parsed rows and current credit memo form values."}, {"title": "Credit memo KPIs", "keys": ["kpi", "total", "fault"], "shows": "Counts, dollars, rep-fault/customer-fault splits, and selected-week impact.", "pulls": "S.cms filtered by selected year/quarter/week and fault classification."}, {"title": "Credit memo form", "keys": ["form", "entry", "fault"], "shows": "Editable details for amount, customer, reason, rep, and fault owner.", "pulls": "Reads/writes S.cms; reads active reps and current tracker week."}, {"title": "Filters and readout", "keys": ["filter", "readout"], "shows": "Credit memo filters and summary readout.", "pulls": "S.cms with selected filters."}, {"title": "Credit memo log", "keys": ["log", "history"], "shows": "Saved memo rows with edit/delete controls.", "pulls": "S.cms localStorage-backed memo history."}]}, "art": {"title": "Art Errors", "summary": "Art/production quality tracker for logging artwork problems, ownership, customer impact, and trends.", "sections": [{"title": "Art error entry", "keys": ["entry", "log art", "art error"], "shows": "Form to log date, rep, order/customer, error type, fault, and notes.", "pulls": "Writes to S.artErrors; reads active rep roster and tracker week."}, {"title": "Art KPI cards", "keys": ["kpi", "quality"], "shows": "Counts, fault breakdown, and current-period art error impact.", "pulls": "S.artErrors filtered by selected year/quarter/week."}, {"title": "Filters", "keys": ["filter"], "shows": "Rep/type/period filters for quality review.", "pulls": "S.artErrors plus active reps and selected tracker context."}, {"title": "Art error log", "keys": ["log", "history"], "shows": "Saved art error incidents with edit/delete controls.", "pulls": "S.artErrors localStorage-backed history."}]}, "perf": {"title": "Performance", "summary": "Rep performance scorecard combining revenue, calls, coverage, forecast, and quality into a management score.", "sections": [{"title": "Rep score panel", "keys": ["score", "rating"], "shows": "Overall performance score, star rating, and rep status.", "pulls": "S.data, S.goals, S.cms, S.artErrors, and HR/coaching notes for selected rep/quarter."}, {"title": "KPI cards", "keys": ["kpi", "snapshot"], "shows": "Revenue pace, calls pace, coverage, forecast, and quality metrics.", "pulls": "Current-quarter rep totals from S.data and goals from S.goals."}, {"title": "Progress bars", "keys": ["progress", "pace"], "shows": "Goal progress and pace against expected quarter progress.", "pulls": "Quarter elapsed weeks plus rep-level S.data/S.goals."}, {"title": "Insights", "keys": ["insight", "recommendation"], "shows": "Strengths, risks, and management notes for the selected rep.", "pulls": "Derived scoring rules using performance and quality data."}, {"title": "Trend chart", "keys": ["chart", "trend"], "shows": "Performance trend over recent weeks.", "pulls": "Weekly rep rows from S.data."}]}, "meeting": {"title": "Meeting Report", "summary": "Weekly meeting report builder that assembles team status, projects, risks, and report output for the selected week.", "sections": [{"title": "Week picker", "keys": ["week picker", "selected week"], "shows": "Selected meeting week and report generation controls.", "pulls": "Top-bar week helpers, S.data, and weekly project storage."}, {"title": "Projects / preview", "keys": ["project", "preview"], "shows": "Report preview, project notes, wins, blockers, and meeting content.", "pulls": "Weekly projects store, S.data weekly metrics, notes, and production/project fields."}, {"title": "Output / result", "keys": ["result", "report"], "shows": "Generated meeting report file/result links.", "pulls": "Report builder functions and local report history."}]}, "review": {"title": "Employee Reviews", "summary": "Employee performance review generator that compiles selected rep/period data into a review packet.", "sections": [{"title": "Review builder", "keys": ["review builder", "generate"], "shows": "Rep/year/quarter selector and review generation controls.", "pulls": "S.data, S.goals, S.coachingNotes, S.hrViolations, S.cms, and S.artErrors for selected rep/period."}, {"title": "Review checklist", "keys": ["checklist"], "shows": "What the review packet includes and what data is checked.", "pulls": "Static review configuration plus selected rep context."}, {"title": "Review preview", "keys": ["preview", "output"], "shows": "Generated performance review sections before export.", "pulls": "Calculated scorecard, notes, quality history, and sales history."}]}, "reports": {"title": "Reports", "summary": "Report-generation command center for quarterly, weekly, AI, manager, rep, and team reports.", "sections": [{"title": "Report hero", "keys": ["report command", "hero"], "shows": "Report workspace overview and primary actions.", "pulls": "Current tracker week/quarter and report history status."}, {"title": "Health strip", "keys": ["health", "overview"], "shows": "Report readiness, data coverage, and current report counts.", "pulls": "S.data, reportHistory, notes, and current tracker filters."}, {"title": "Report builders", "keys": ["builder", "layout", "report"], "shows": "Available report types and generation controls.", "pulls": "S.data, S.goals, S.reps, S.cms, S.artErrors, S.coachingNotes, S.hrViolations, and production/project data."}]}, "prodintel": {"title": "Production Intelligence", "summary": "Production operations workspace for jobs, deadlines, order status, and production-facing intelligence.", "sections": [{"title": "Production intelligence hero", "keys": ["production intelligence", "hero"], "shows": "Production workspace context and quick actions.", "pulls": "Production intelligence storage and current tracker context."}, {"title": "Production panels", "keys": ["production", "status", "project"], "shows": "Production status, workload, timeline, and risk information.", "pulls": "Production/project data stores and configured production fields."}]}, "cknow": {"title": "Company Knowledge", "summary": "Internal knowledge base for procedures, company context, product information, and manager reference material.", "sections": [{"title": "Knowledge hero", "keys": ["company knowledge", "knowledge base"], "shows": "Knowledge center purpose and update controls.", "pulls": "S.companyKnowledge categories, freeform notes, and last-updated metadata."}, {"title": "Metrics", "keys": ["metrics"], "shows": "Knowledge coverage and recent update counts.", "pulls": "S.companyKnowledge category totals and timestamps."}, {"title": "Knowledge panels", "keys": ["policy", "procedure", "products", "category", "panel"], "shows": "Editable company knowledge sections by category.", "pulls": "S.companyKnowledge.categories and S.companyKnowledge.freeform."}]}, "inbound": {"title": "Inbound Leads", "summary": "Lead intake and follow-up tracker for inbound opportunities.", "sections": [{"title": "Lead entry", "keys": ["lead", "inbound", "entry"], "shows": "Lead form, source, rep assignment, and follow-up controls.", "pulls": "Inbound lead localStorage store and active rep roster."}, {"title": "Lead log", "keys": ["log", "pipeline"], "shows": "Saved inbound lead pipeline and statuses.", "pulls": "Inbound lead localStorage store filtered by status/rep/source."}]}, "customers": {"title": "Customers", "summary": "Customer intelligence workspace tied to reps, customer lists, and account coverage.", "sections": [{"title": "Customer lists", "keys": ["customer", "account", "list"], "shows": "Rep customer lists, account intelligence, and coverage notes.", "pulls": "S.reps profile customer lists and customer localStorage stores."}, {"title": "Customer analysis", "keys": ["analysis", "intelligence"], "shows": "Account counts, notes, and customer-level insights.", "pulls": "Saved customer lists plus coverage/call data from S.data when available."}]}, "reviews": {"title": "Customer Reviews", "summary": "Google and Trustpilot customer review payout tracker. It imports the published review CSV, dedupes review rows, matches reps, and calculates weekly $10 review payouts using the tracker week.", "sections": [{"title": "Review feed", "keys": ["review feed", "customer reviews"], "shows": "CSV URL input, sync status, and refresh control.", "pulls": "Published Google Sheet CSV URL stored in S.reviews.url; imported rows stored in S.reviews.rows."}, {"title": "Viewing filters", "keys": ["viewing", "week", "filter"], "shows": "Selected year/quarter/week, previous-week navigation, and match-tracker-week controls.", "pulls": "Main tracker week helpers, S.reviews rows, and tracker week range functions."}, {"title": "Review KPI cards", "keys": ["reviews this week", "payout this week", "google", "trustpilot"], "shows": "Current-week review count, payout total, and Google/Trustpilot split.", "pulls": "S.reviews.rows filtered to the selected tracker week; payout rows require Google/Trustpilot and matched rep."}, {"title": "Review charts", "keys": ["reviews / week", "source split", "top reps"], "shows": "Eight-week review trend, source split, and top reps for the week.", "pulls": "S.reviews.rows with dedupe/decision status and selected tracker week range."}, {"title": "Weekly payout", "keys": ["weekly payout", "payroll"], "shows": "Payroll-ready payout table and copy button.", "pulls": "Matched Google/Trustpilot reviews in the selected week multiplied by REVIEW_PAY."}, {"title": "Reviews grouped by rep", "keys": ["reviews this week", "grouped by rep"], "shows": "Review details grouped by matched or unmatched rep.", "pulls": "S.reviews.rows enriched with platform, stars, customer name, duplicate decisions, and rep matching."}]}, "history": {"title": "Report History", "summary": "Saved report archive for generated reports and reviewable outputs.", "sections": [{"title": "History filters", "keys": ["filter", "history"], "shows": "Report type and subject filters.", "pulls": "reportHistory localStorage-backed array."}, {"title": "Report list", "keys": ["report list", "history list"], "shows": "Saved reports with view/delete controls.", "pulls": "reportHistory filtered by type and subject."}]}, "lb": {"title": "Leaderboard", "summary": "Sales performance leaderboard across reps and selected metrics.", "sections": [{"title": "Leaderboard controls", "keys": ["controls", "leaderboard"], "shows": "Metric/timeframe toggles.", "pulls": "Selected tracker week/quarter, S.data, goals, and active rep roster."}, {"title": "Podium and rankings", "keys": ["podium", "rank", "leaderboard"], "shows": "Top performers and ranked list.", "pulls": "Calculated metric totals from S.data, S.goals, review data, or quality logs depending on selected leaderboard mode."}]}, "daily": {"title": "Daily Sales & Calls", "summary": "Daily sales calendar and per-rep daily SMB tracker. It marries the team running total entry with per-rep cumulative entries and opens day-level rep rankings from the calendar.", "sections": [{"title": "Daily sales entry", "keys": ["daily sales entry", "input", "running total", "per-rep daily entry"], "shows": "One selected date driving team running total, CORP day sales, and per-rep SMB cumulative totals.", "pulls": "Reads/writes S.dailySales for running totals and S.dailyRep for per-rep cumulative SMB entries; reads active reps."}, {"title": "Calendar controls", "keys": ["month controls", "controls"], "shows": "Month selector, refresh/clear controls, and daily calendar navigation.", "pulls": "S.dailySales, S.dailyRep, and selected date/month."}, {"title": "Daily summary", "keys": ["summary", "kpi"], "shows": "Monthly/daily summary cards for totals, days, SMB/CORP, and averages.", "pulls": "S.dailySales entries for the selected month plus S.dailyRep where applicable."}, {"title": "Daily calendar", "keys": ["calendar", "daily sales log"], "shows": "Calendar cells with day totals and top SMB rep badge. Clicking a day opens per-rep rankings.", "pulls": "S.dailySales for team totals and S.dailyRep for per-rep day deltas/rankings."}]}, "calc": {"title": "Deadline Calculator", "summary": "Production deadline calculator for determining whether an order can hit an in-hands date.", "sections": [{"title": "Deadline calculator", "keys": ["deadline calculator", "can we hit"], "shows": "Timeline calculator using garment arrival, art status, decoration methods, production lead times, and transit.", "pulls": "User-entered calculator fields, production lead-time settings, and optional production status data."}]}, "intel": {"title": "Forecast", "summary": "Seasonal and event-based sales forecast/intelligence page for upcoming opportunities and call windows.", "sections": [{"title": "Forecast hero", "keys": ["forecast", "seasonal"], "shows": "Forecast workspace context and refresh controls.", "pulls": "Forecast event data, tracker date context, and cached AI/event intelligence if configured."}, {"title": "Next 7 days", "keys": ["next 7 days", "immediate"], "shows": "Events or opportunities requiring quick-turn action.", "pulls": "Forecast event list filtered to the next seven days."}, {"title": "Rest of this month", "keys": ["rest of this month", "near term"], "shows": "Events in the next two to four weeks.", "pulls": "Forecast event list filtered to the remaining current month."}, {"title": "Rest of this quarter", "keys": ["rest of this quarter", "planning window"], "shows": "Quarter planning opportunities.", "pulls": "Forecast event list filtered to current-quarter remaining window."}, {"title": "Next quarter", "keys": ["next quarter", "ahead"], "shows": "Long-lead opportunities.", "pulls": "Forecast event list filtered to next quarter."}, {"title": "Downtime call windows", "keys": ["downtime", "call strategy"], "shows": "Industries likely in slower seasons for proactive calls.", "pulls": "Configured industry seasonality/intelligence rules."}]}, "games": {"title": "Games", "summary": "Sales games engine for creating team games, importing rulebooks, building rosters, and simulating outcomes.", "sections": [{"title": "Game command center", "keys": ["game command", "sales game"], "shows": "Game setup controls and generation actions.", "pulls": "Active reps, selected tracker period, game rulebook storage, and optional external roster entries."}, {"title": "Rulebook upload", "keys": ["rulebook"], "shows": "Uploaded game rules and preview.", "pulls": "Game rulebook localStorage store and uploaded file text."}, {"title": "Roster", "keys": ["roster"], "shows": "Eligible reps/external participants for games.", "pulls": "S.reps active roster plus preconfigured game externals."}, {"title": "Game content / simulation", "keys": ["simulation", "content"], "shows": "Generated game details, scoring, and simulation output.", "pulls": "Game result/simulation localStorage stores and selected tracker data."}]}, "gtrack": {"title": "Game Tracker", "summary": "Game scoring and results tracker.", "sections": [{"title": "Game tracker setup", "keys": ["game tracker", "setup"], "shows": "Game configuration and scoring controls.", "pulls": "Game tracker localStorage store and active roster."}, {"title": "Game results", "keys": ["results", "score"], "shows": "Current standings and game performance.", "pulls": "Saved game tracker data and selected sales metrics."}]}, "notifs": {"title": "Notifications", "summary": "Notification center for sales, quality, HR, forecast, and operational alerts.", "sections": [{"title": "Notification metrics", "keys": ["metrics", "notifications"], "shows": "Counts and priority summary of current alerts.", "pulls": "Derived alerts from S.data, goals, credit memos, art errors, HR/coaching notes, and production/forecast data."}, {"title": "Notification toolbar", "keys": ["toolbar", "filter"], "shows": "Filters and actions for the notification log.", "pulls": "Notification state plus active tracker context."}, {"title": "Notification log", "keys": ["log", "alerts"], "shows": "Detailed alert list with status.", "pulls": "Generated notification array and local dismissed/read state."}]}, "admin": {"title": "Admin", "summary": "System administration and storage tools for backups, data health, API keys, and tracker maintenance.", "sections": [{"title": "Admin hero", "keys": ["admin", "system"], "shows": "System admin overview and key actions.", "pulls": "Tracker state, storage status, and configuration values."}, {"title": "Status grid", "keys": ["status", "storage"], "shows": "Storage/data health indicators.", "pulls": "localStorage usage, S object totals, caches, and file-handle status where supported."}, {"title": "Admin tools", "keys": ["tools", "backup", "api"], "shows": "Backup/import/export/API/storage cleanup tools.", "pulls": "localStorage, exported JSON, optional API/proxy settings, cache stores, and tracker state."}]}, "coach": {"title": "Rep Coaching Center", "summary": "Coaching workspace that turns rep performance, quality, and documentation into action recommendations.", "sections": [{"title": "Coaching score", "keys": ["score", "coach"], "shows": "Rep health score, priority, and coaching context.", "pulls": "S.data, S.goals, S.cms, S.artErrors, S.hrViolations, and S.coachingNotes."}, {"title": "Snapshot KPIs", "keys": ["snapshot", "kpi"], "shows": "Revenue, calls, coverage, forecast, and quality snapshot.", "pulls": "Selected rep current-quarter metrics and goals."}, {"title": "Recommendations", "keys": ["recommendation", "action"], "shows": "Strengths, risks, and suggested coaching actions.", "pulls": "Derived rules from pace, quality, HR, and notes."}, {"title": "Timeline", "keys": ["timeline"], "shows": "Recent rep events, notes, HR, credit memos, and art errors.", "pulls": "S.coachingNotes, S.hrViolations, S.cms, and S.artErrors."}]}, "forecast2": {"title": "Forecast Command Center", "summary": "Advanced forecast cockpit for projection, gap, need-per-week, and confidence.", "sections": [{"title": "Projection panels", "keys": ["projection", "gap", "confidence"], "shows": "Projected finish, gap to goal, weekly need, and confidence.", "pulls": "S.data current-quarter revenue, S.goals, elapsed weeks, and forecast formulas."}, {"title": "Watch cards", "keys": ["watch", "risk"], "shows": "Risks and opportunities based on forecast movement.", "pulls": "Derived forecast signals from sales history and goals."}]}};
  var PANEL_SELECTOR = ['section','.wk-panel','.wk-health-panel','.yo-panel','.entry-panel','.admin-tool-card','.admin-sys-hero','.admin-sys-grid','.profile-hero-card','.profile-panel','.profile-feed-card','.hr-entry-panel','.hr-log-panel','.hr-summary-panel','.credit-panel','.art-panel','.perf-score-panel','.perf-panel','.reviews-panel','.reviews-output-shell','.reports-hero','.reports-v278-health-strip','.reports-v278-layout','.prodintel-panel','.prodintel-hero','.cknow-panel','.daily-panel','.forecast-panel','.meeting-panel','.notif-hero','.notif-toolbar','.notif-layout','.coach-panel','.forecast2-panel','#pg-games > .card','#pg-history > .card','#pg-lb > .card','#pg-gtrack > .card','#pg-inbound > .card'].join(',');
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function activePage(){return document.querySelector('.page.active')||document.getElementById('pg-dash');}
  function activePageId(){var p=activePage();return p&&p.id?p.id.replace(/^pg-/,''):'dash';}
  function cssEsc(s){try{return (window.CSS&&CSS.escape)?CSS.escape(s):String(s).replace(/[^a-zA-Z0-9_-]/g,'\\$&');}catch(e){return String(s||'').replace(/[^a-zA-Z0-9_-]/g,'\\$&');}}
  function getPageReg(id){return REG[id]||{title:pageLabel(id),summary:'This page uses the Sales Tracker standalone state and selected tracker context. Use the section help cards below to verify what each visible area is showing and pulling.',sections:[]};}
  function pageLabel(id){var b=[].slice.call(document.querySelectorAll('#tabBar .tab')).find(function(x){return ((x.getAttribute('onclick')||'').indexOf("'"+id+"'")>=0)||((x.textContent||'').toLowerCase().indexOf(id)>=0);});return (b?b.textContent.replace(/\s+/g,' ').trim():'Sales Tracker Page')||id;}
  function heading(el){
    if(!el)return '';
    var q=el.querySelector('h1,h2,h3,.ct,.reviews-title,.credit-section-title,.art-section-title,.daily-section-title,.meeting-title,.perf-panel h3,.profile-panel-title,.yo-section-head h2,.wk-section-head h2,.reports-v278-title,.prodintel-title,.cknow-title,.notif-title,.coach-panel-title,.forecast2-panel-title,.r3-name');
    var t=q?(q.textContent||''):'';
    t=t.replace(/\?/g,'').replace(/\s+/g,' ').trim();
    if(!t && el.getAttribute('aria-label'))t=el.getAttribute('aria-label');
    if(!t && el.id)t=el.id.replace(/^pg-/,'').replace(/[-_]/g,' ');
    return t||'';
  }
  function sectionText(el){return norm([heading(el),el.id||'',el.className||''].join(' '));}
  function matchSection(id,el){
    var reg=getPageReg(id), txt=sectionText(el), secs=reg.sections||[];
    for(var i=0;i<secs.length;i++){
      var keys=(secs[i].keys||[]).concat([secs[i].title||'']);
      for(var j=0;j<keys.length;j++){
        var k=norm(keys[j]);
        if(k && txt.indexOf(k)>=0)return secs[i];
      }
    }
    var h=heading(el);
    return {title:h||'This section',shows:'A visible section on '+(reg.title||'this page')+'.',pulls:'Sales Tracker standalone state, localStorage-backed S data, and/or the current controls visible in this section.',checks:'Use this section title and the current page controls in the audit prompt to verify the exact data path.'};
  }
  function sectionCardsForPage(id){
    var reg=getPageReg(id), arr=(reg.sections||[]).slice();
    if(arr.length)return arr;
    var p=activePage();
    if(!p)return [];
    var out=[];
    [].slice.call(p.querySelectorAll(PANEL_SELECTOR)).forEach(function(el){
      var h=heading(el);if(!h)return;
      if(out.some(function(x){return norm(x.title)===norm(h);}))return;
      out.push(matchSection(id,el));
    });
    return out;
  }
  function contextLine(){
    function v(id){var el=document.getElementById(id);return el?(el.value||el.textContent||'').trim():'';}
    var bits=[];
    var y=v('yr')||v('yearSel')||v('yoYear'); if(y)bits.push('Year '+y);
    var q=v('qtr')||v('qSel')||v('q'); if(q)bits.push('Quarter '+q);
    var m=v('mo')||v('monthSel'); if(m)bits.push('Month '+m);
    var w=v('wk')||v('weekSel'); if(w)bits.push('Week '+w);
    try{if(typeof getYr==='function'&&typeof getQ==='function'&&typeof getWN==='function')bits.push('Tracker: '+getYr()+' '+getQ()+' Wk '+getWN());}catch(e){}
    return bits.length?bits.join(' • '):'Tracker context is pulled from the current page selectors and saved app state.';
  }
  function controlsSummary(){
    var p=activePage();if(!p)return 'No active page controls found.';
    var fields=[].slice.call(p.querySelectorAll('select,input:not([type="hidden"]),textarea')).filter(function(el){
      if(el.type==='file'||el.type==='button'||el.type==='submit')return false;
      var r=el.getBoundingClientRect();return r.width>0&&r.height>0;
    }).slice(0,28).map(function(el){
      var lab='';
      if(el.id){var l=p.querySelector('label[for="'+cssEsc(el.id)+'"]'); if(l)lab=l.textContent;}
      if(!lab){var parent=el.closest('label'); if(parent)lab=parent.textContent.replace(el.value||'','');}
      lab=(lab||el.getAttribute('aria-label')||el.name||el.id||el.placeholder||'field').replace(/\s+/g,' ').trim();
      var val=(el.tagName==='SELECT')?(el.options[el.selectedIndex]?el.options[el.selectedIndex].text:el.value):el.value;
      if(String(val||'').length>80)val=String(val).slice(0,80)+'…';
      return lab+': '+(val||'(blank)');
    });
    return fields.length?fields.join('\n'):'No visible controls detected on this page.';
  }
  function auditText(id){
    id=id||activePageId();
    var reg=getPageReg(id), secs=sectionCardsForPage(id);
    var lines=[];
    lines.push('Sales Tracker page data-pull audit');
    lines.push('Page: '+(reg.title||id)+' ('+id+')');
    lines.push('Current context: '+contextLine());
    lines.push('');
    lines.push('Page description: '+(reg.summary||''));
    lines.push('');
    lines.push('Visible controls / filters:');
    lines.push(controlsSummary());
    lines.push('');
    lines.push('Expected section pulls:');
    secs.forEach(function(s,i){
      lines.push((i+1)+'. '+s.title);
      lines.push('   Shows: '+(s.shows||''));
      lines.push('   Pulls: '+(s.pulls||''));
      if(s.checks)lines.push('   Check: '+s.checks);
    });
    lines.push('');
    lines.push('Please verify whether each visible section is pulling from the correct Sales Tracker data source and whether the current filters/context line up with the displayed numbers.');
    return lines.join('\n');
  }
  function toast(msg){
    var t=document.getElementById('tcpHelpToast');if(!t){t=document.createElement('div');t.id='tcpHelpToast';t.className='tcp-help-toast';document.body.appendChild(t);}t.textContent=msg||'Copied';t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(function(){t.classList.remove('show');},2200);
  }
  function copyAudit(id){
    var txt=auditText(id||activePageId());
    function done(){toast('Audit prompt copied');}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){fallbackCopy(txt);});}else fallbackCopy(txt);
  }
  function fallbackCopy(txt){var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');toast('Audit prompt copied');}catch(e){alert(txt);}ta.remove();}
  function ensureModal(){
    if(document.getElementById('tcpHelpModal'))return;
    var m=document.createElement('div');m.id='tcpHelpModal';m.className='tcp-help-modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.innerHTML='<div class="tcp-help-dialog" onclick="event.stopPropagation()"><div class="tcp-help-head"><div><div class="tcp-help-kicker" id="tcpHelpKicker">Page guide</div><h2 class="tcp-help-title" id="tcpHelpTitle">Help</h2><p class="tcp-help-summary" id="tcpHelpSummary"></p></div><div class="tcp-help-actions"><button class="tcp-help-copy" type="button" id="tcpHelpCopy">Copy audit prompt</button><button class="tcp-help-close" type="button" id="tcpHelpClose" aria-label="Close">×</button></div></div><div class="tcp-help-body" id="tcpHelpBody"></div></div>';
    m.addEventListener('click',closeHelp);
    document.body.appendChild(m);
    document.getElementById('tcpHelpClose').addEventListener('click',closeHelp);
    document.getElementById('tcpHelpCopy').addEventListener('click',function(){copyAudit(activePageId());});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeHelp();});
  }
  function managerPurpose(section){
    return section && section.shows ? section.shows : 'This section gives managers a quick read on the selected page area.';
  }
  function managerHow(section){
    if(section && section.how) return section.how;
    if(section && section.checks) return section.checks;
    var title=((section&&section.title)||'this section').toLowerCase();
    if(/entry|input|log|upload|feed|import|save/.test(title)) return 'Use this area to enter, upload, save, or refresh the information before reviewing the related summary below.';
    if(/filter|viewing|selector|control/.test(title)) return 'Use the selectors to choose the year, quarter, week, rep, or view you want to inspect. The rest of the page follows those choices.';
    if(/chart|trend|pace|forecast|map|timeline|board/.test(title)) return 'Use this as a visual checkpoint for direction, risk, momentum, and whether the team is on pace.';
    if(/log|table|list|review|notes|history/.test(title)) return 'Use this as the detail view when you need to inspect the records behind the summary numbers.';
    return 'Start with the headline number or status, then use the detail rows/cards to decide whether action, coaching, follow-up, or verification is needed.';
  }
  function managerReports(section){
    return section && section.shows ? section.shows : 'The visible metrics, lists, notes, charts, or status cards in this section.';
  }
  function openHelp(opts){
    ensureModal();
    var id=(opts&&opts.pageId)||activePageId(), reg=getPageReg(id), body=document.getElementById('tcpHelpBody');
    var section=opts&&opts.section;
    var copyBtn=document.getElementById('tcpHelpCopy');
    if(copyBtn)copyBtn.style.display=section?'none':'';
    document.getElementById('tcpHelpKicker').textContent=section?'Section guide':'Page audit';
    document.getElementById('tcpHelpTitle').textContent=section?(section.title||'Section help'):(reg.title||pageLabel(id));
    document.getElementById('tcpHelpSummary').textContent=section?'Manager quick guide: what this area is for, how to use it, and what it reports.':(reg.summary||'Page description, section-by-section data-pull breakdown, and audit prompt.');
    var html='';
    if(section){
      html+='<div class="tcp-help-grid"><div class="tcp-help-card full"><h3>'+esc(section.title||'This section')+'</h3><div class="tcp-help-row"><strong>Purpose</strong>'+esc(managerPurpose(section))+'</div><div class="tcp-help-row"><strong>How to use</strong>'+esc(managerHow(section))+'</div><div class="tcp-help-row"><strong>Reports</strong>'+esc(managerReports(section))+'</div></div></div>';
    }else{
      html='<div class="tcp-help-meta"><strong>Current context:</strong> <code>'+esc(contextLine())+'</code><br>Use <strong>Copy audit prompt</strong> when you want Chat/Claude to check this page against the intended data pulls.</div>';
      var secs=sectionCardsForPage(id);
      html+='<div class="tcp-help-grid">'+secs.map(function(s){return '<div class="tcp-help-card"><h3>'+esc(s.title||'Section')+'</h3><div class="tcp-help-row"><strong>Shows</strong>'+esc(s.shows||'Section contents.')+'</div><div class="tcp-help-row"><strong>Pulls</strong>'+esc(s.pulls||'Sales Tracker saved data and page filters.')+'</div>'+(s.checks?'<div class="tcp-help-row"><strong>Check</strong>'+esc(s.checks)+'</div>':'')+'</div>';}).join('')+'</div>';
    }
    body.innerHTML=html;
    document.getElementById('tcpHelpModal').classList.add('open');
  }
  function closeHelp(){var m=document.getElementById('tcpHelpModal');if(m)m.classList.remove('open');}
  function ensureFab(){
    if(document.getElementById('tcpHelpFab'))return;
    var b=document.createElement('button');b.type='button';b.id='tcpHelpFab';b.className='tcp-help-fab';b.innerHTML='⚙';b.title='Page audit and data-pull breakdown';b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openHelp({pageId:activePageId()});});document.body.appendChild(b);
  }
  function shouldHelp(el,page){
    if(!el||el.id==='tcpHelpModal'||el.closest('#tcpHelpModal'))return false;
    if(el.getAttribute('data-tcp-help-mounted')==='1')return false;
    if(el.querySelector(':scope > .tcp-help-btn'))return false;
    if(el.querySelector(':scope > .tcp-help-dock'))return false;
    if(el.querySelector('.wk-help-btn'))return false;
    if(el.closest('.tcp-help-modal'))return false;
    if(el.closest('#tabBar,.top-bar,.nav-row'))return false;
    var r=el.getBoundingClientRect();
    if(r.width<260||r.height<70)return false;
    var h=heading(el);
    if(!h && !/panel|hero|card|section|layout|toolbar|metrics/i.test(el.className||''))return false;
    if(el!==page && page && !page.contains(el))return false;
    return true;
  }
  function firstDirect(el,selector){
    try{return el.querySelector(':scope > '+selector);}catch(e){return null;}
  }
  function helpHeader(el){
    if(!el)return null;
    var sels=[
      '.yo-section-head','.wl-section-head','.daily-panel-head','.credit-panel-head','.art-panel-head','.reviews-panel-head',
      '.reports-panel-head','.meeting-panel-head','.hr-panel-head','.entry-panel-head','.admin-card-head','.forecast-panel-head',
      '.perf-panel-head','.score-panel-head','.coach-panel-head','.notif-panel-head','.cknow-panel-head','.prodintel-panel-head',
      '.profile-panel-title','.profile-pace-header','.dash-section-topbar','.wk-section-head','.dc2-head',
      '.dash-hero','.wk-exec-hero','.yo-hero','.wl-hero','.daily-hero','.credit-hero','.art-hero','.reviews-hero',
      '.reports-hero','.meeting-hero','.hr-hero','.entry-hero','.admin-hero-panel','.forecast-hero','.perf-hero','.score-hero',
      '.coach-hero','.notif-hero','.prodintel-hero','.cknow-hero','.ct'
    ];
    for(var i=0;i<sels.length;i++){
      var s=sels[i];
      if(el.matches&&el.matches(s))return el;
      var direct=firstDirect(el,s); if(direct)return direct;
    }
    var first=el.firstElementChild;
    if(first&&(/head|hero|title|toolbar|topbar/i.test(first.className||'')||first.querySelector('h1,h2,h3,.ct')))return first;
    return null;
  }
  function mountHelpButton(el,btn){
    var head=helpHeader(el);
    if(head){
      head.classList.add('tcp-help-header');
      var dock=firstDirect(head,'.tcp-help-dock');
      if(!dock){dock=document.createElement('span');dock.className='tcp-help-dock';dock.setAttribute('aria-hidden','false');head.appendChild(dock);}
      btn.classList.add('tcp-help-btn-inline');
      dock.appendChild(btn);
    }else{
      btn.classList.add('tcp-help-btn-fallback');
      el.appendChild(btn);
    }
  }
  var refreshTimer=null;
  function refreshHelp(){
    ensureFab();ensureModal();
    var page=activePage();if(!page)return;
    var id=activePageId();
    var candidates=[];
    [].slice.call(page.querySelectorAll(PANEL_SELECTOR)).forEach(function(el){if(candidates.indexOf(el)<0)candidates.push(el);});
    candidates.forEach(function(el){
      if(!shouldHelp(el,page))return;
      el.classList.add('tcp-help-section');
      el.setAttribute('data-tcp-help-mounted','1');
      var btn=document.createElement('button');
      btn.type='button';
      btn.className='tcp-help-btn';
      btn.textContent='?';
      btn.title='Section guide';
      btn.setAttribute('aria-label','Section guide');
      btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openHelp({pageId:id,section:matchSection(id,el)});});
      mountHelpButton(el,btn);
    });
  }
  function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshHelp,180);}
  window.tcpOpenPageHelp=function(){openHelp({pageId:activePageId()});};
  window.tcpHelpRefresh=refreshHelp;
  window.tcpCopyPageAuditPrompt=function(){copyAudit(activePageId());};
  function init(){
    ensureFab();ensureModal();scheduleRefresh();
    var old=window.gt;
    if(typeof old==='function'&&!old._tcpHelpWrapped){
      var wrapped=function(){var res=old.apply(this,arguments);scheduleRefresh();setTimeout(refreshHelp,450);return res;};
      wrapped._tcpHelpWrapped=true;window.gt=wrapped;
    }
    try{new MutationObserver(function(){scheduleRefresh();}).observe(document.querySelector('.wrap')||document.body,{childList:true,subtree:true});}catch(e){}
    document.addEventListener('click',function(e){var tab=e.target&&e.target.closest?e.target.closest('#tabBar button,.tab'):null;if(tab)setTimeout(refreshHelp,260);},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
