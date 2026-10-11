"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const admin=fs.readFileSync(path.join(root,"public/admin.js"),"utf8");
const html=fs.readFileSync(path.join(root,"public/admin.html"),"utf8");
const now=Date.parse("2026-10-12T00:44:00Z");
const cutoff=now-86400000;
const event=(at,visitor,session)=>({created_at:new Date(at).toISOString(),event_name:"page_view",visitor_id:visitor,session_id:session});
const state={events:[
  event(cutoff-1,"old","old"),
  event(cutoff,"a","s1"),
  event(now-7200000,"a","s1"), // Same session across midnight.
  event(now-3600000,"a","s2"),
  event(now,"b","s3"),
  event(now+1,"future","future"),
  {...event(now-1000,"c","s4"),event_name:"product_view"},
  {...event(now-1000,null,"legacy")}
]};
const start=admin.indexOf("  function analyticsStart(");
const end=admin.indexOf("\n  function rankBy(",start);
assert(start>=0&&end>start);
class FixedDate extends Date {static now(){return now;}}
const functions=new Function("state","Date","safeText",admin.slice(start,end)+"\nreturn {analyticsStart,analyticsSnapshot};")(state,FixedDate,String);
assert.equal(functions.analyticsStart(1).getTime(),cutoff);
const stats=functions.analyticsSnapshot(1);
assert.equal(stats.views.length,5,"exclude old/future/non-page-view events, include both boundaries");
assert.deepEqual(stats.websiteVisits,{visitors:2,visits:3,repeatVisits:1,average:1.5});
assert.equal(stats.daily.length,24);
assert.equal(stats.daily.reduce((sum,h)=>sum+h.views,0),stats.views.length,"hourly chart matches total");
assert.equal(stats.daily[0].views,1);
assert.equal(stats.daily[23].views,3);
for(const days of [7,30,90]){
  const expected=new Date(now);expected.setHours(0,0,0,0);expected.setDate(expected.getDate()-days+1);
  assert.equal(functions.analyticsStart(days).getTime(),expected.getTime());
  assert.equal(functions.analyticsSnapshot(days).daily.length,days);
}
assert(html.includes('<option value="1" selected>Last 24 hours</option>'));
assert(html.includes("Visits · last 24 hours"));
assert(admin.includes('$("metricViews").textContent=last24.websiteVisits.visits.toLocaleString()'));
console.log("Admin rolling 24-hour visits checks passed.");
