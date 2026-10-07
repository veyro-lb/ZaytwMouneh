const {defineConfig,devices}=require("@playwright/test");
module.exports=defineConfig({
  testDir:"./tests",
  testMatch:"browser-regression.spec.cjs",
  timeout:300000,
  expect:{timeout:7000},
  fullyParallel:false,
  workers:1,
  reporter:[["line"],["html",{open:"never"}]],
  use:{baseURL:"http://127.0.0.1:4173",ignoreHTTPSErrors:true,screenshot:"only-on-failure",trace:"retain-on-failure"},
  webServer:{command:"node tests/serve-public.cjs",url:"http://127.0.0.1:4173",timeout:15000,reuseExistingServer:false},
  projects:[
    {name:"chromium",use:{...devices["Desktop Chrome"]}},
    {name:"webkit",use:{...devices["Desktop Safari"]}}
  ]
});
