#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");

const root=path.resolve(__dirname,"..");
const publicDir=path.join(root,"public");
const source=fs.readFileSync(path.join(publicDir,"product-photos.js"),"utf8");
const match=source.match(/const map\s*=\s*(\{[\s\S]*?\n\});/);
assert(match,"Expected product-photo map");
const map=JSON.parse(match[1]);
const cutouts=Object.entries(map).filter(([,photo])=>photo.quality==="source-faithful-transparent-cutout");
assert(cutouts.length>0,"Expected mapped, verified product cutouts");

const verified=new Set();
for(const [productId,photo]of cutouts){
  assert(/^assets\/products\/cutouts\/[\w-]+\.svg$/.test(photo.url),productId+": invalid cutout location");
  assert(/^assets\/products\/originals\/[\w-]+\.jpe?g$/.test(photo.originalUrl||""),productId+": original source must be recorded");
  assert(Number(photo.width)>0&&Number(photo.height)>0,productId+": invalid dimensions");
  const svgPath=path.join(publicDir,photo.url);
  const sourcePath=path.join(publicDir,photo.originalUrl);
  assert(fs.existsSync(svgPath),productId+": cutout not present");
  assert(fs.existsSync(sourcePath),productId+": original not present");
  const svg=fs.readFileSync(svgPath,"utf8");
  assert(svg.includes('<clipPath id="product">')&&svg.includes('clip-path="url(#product)"'),productId+": transparency mask missing");
  assert(!/<script\b|\bonload\s*=|\bonerror\s*=/i.test(svg),productId+": unsafe SVG script");
  assert(new RegExp('width="'+photo.width+'"').test(svg)&&new RegExp('height="'+photo.height+'"').test(svg),productId+": dimension mismatch");
  const payload=svg.match(/href="data:image\/jpeg;base64,([A-Za-z0-9+/=]+)"/);
  assert(payload,productId+": original photograph not embedded");
  const embedded=Buffer.from(payload[1],"base64");
  const original=fs.readFileSync(sourcePath);
  const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
  assert.equal(sha(embedded),sha(original),productId+": cutout does not preserve exact original pixels");
  verified.add(photo.url);
}
console.log("PASS: "+cutouts.length+" product IDs use "+verified.size+" source-faithful, transparently masked SVG cutouts; originals match exactly");
