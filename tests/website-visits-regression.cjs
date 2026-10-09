"use strict";

// Run with: node tests/website-visits-regression.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

const admin=read("public/admin.js");
const runtime=read("public/site-runtime-v9.js");
const html=read("public/admin.html");
const migration=read("supabase/migrations/20261009200519_website_unique_visitors_20261009.sql");

const begin=admin.indexOf("  function websiteVisitMetrics(pageViews){");
const end=admin.indexOf("\n  function analyticsSnapshot(days){",begin);
assert(begin>=0&&end>begin,"visitor aggregator must exist");
const websiteVisitMetrics=new Function(admin.slice(begin,end)+"\nreturn websiteVisitMetrics;")();

assert.deepEqual(websiteVisitMetrics([]),{visitors:0,visits:0,repeatVisits:0,average:0});
const events=[
  {visitor_id:"visitor-a",session_id:"session-1"},
  {visitor_id:"visitor-a",session_id:"session-1"}, // refresh is not a visit
  {visitor_id:"visitor-a",session_id:"session-2"}, // repeat visit
  {visitor_id:"visitor-b",session_id:"session-3"},
  {visitor_id:null,session_id:"legacy-session"}, // pre-rollout
  {visitor_id:"visitor-c",session_id:null} // unidentifiable session
];
assert.deepEqual(websiteVisitMetrics(events),{visitors:2,visits:3,repeatVisits:1,average:1.5});
assert.deepEqual(websiteVisitMetrics([{visitor_id:"x",session_id:"s"}]),{visitors:1,visits:1,repeatVisits:0,average:1});

assert(runtime.includes('const VISITOR_KEY = "zwm:analytics:visitor:v1"'),"first-party local ID");
assert(runtime.includes('if(eventName==="page_view"){'),"visitor ID should only accompany page views");
assert(runtime.includes("if(id)row.visitor_id=id"),"page-view visitor ID should be sent");
assert(runtime.includes("analyticsOptedOut()"),"owner opt-out must be honored");
assert(html.includes('id="websiteUniqueVisitors"'),"unique visitor tile");
assert(html.includes('id="websiteTotalVisits"'),"visit tile");
assert(html.includes('id="websiteAverageVisits"'),"average visit tile");
assert(html.includes('id="websiteRepeatVisits"'),"repeat visit tile");
assert(/add column if not exists visitor_id uuid/i.test(migration),"nullable visitor ID migration");
for(const page of ["index","shop","about","contact","gift","wholesale","recipes","account","checkout"]){
  assert(read("public/"+page+".html").includes("site-runtime-v9.js?v=20261009-website-visits1"),page+" must use new tracking runtime");
}
console.log("Website Visits regression checks passed.");
