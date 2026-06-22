import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "local_db.json");

function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

function getValueByPath(obj: any, pathStr: string) {
  const parts = pathStr.split("/").filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return null;
    current = current[part];
  }
  return current === undefined ? null : current;
}

function setValueByPath(obj: any, pathStr: string, value: any) {
  const parts = pathStr.split("/").filter(Boolean);
  if (parts.length === 0) return value;
  
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return obj;
}

function deleteValueByPath(obj: any, pathStr: string) {
  const parts = pathStr.split("/").filter(Boolean);
  if (parts.length === 0) return {};
  
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null) return obj;
    current = current[part];
  }
  delete current[parts[parts.length - 1]];
  return obj;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dbPath = searchParams.get("path");
  
  if (!dbPath) return NextResponse.json(getDb());
  
  const db = getDb();
  const value = getValueByPath(db, dbPath);
  
  return NextResponse.json(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: dbPath, data } = body;
    
    if (!dbPath) return NextResponse.json({ error: "path is required" }, { status: 400 });
    
    let db = getDb();
    db = setValueByPath(db, dbPath, data);
    saveDb(db);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    // For PATCH, body is an object of updates: { "events/1234/name": "test", ... }
    let db = getDb();
    
    for (const key of Object.keys(body)) {
      db = setValueByPath(db, key, body[key]);
    }
    
    saveDb(db);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const dbPath = searchParams.get("path");
  
  if (!dbPath) return NextResponse.json({ error: "path is required" }, { status: 400 });
  
  let db = getDb();
  db = deleteValueByPath(db, dbPath);
  saveDb(db);
  
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const dbPath = searchParams.get("path");
    
    if (!dbPath) return NextResponse.json({ error: "path is required" }, { status: 400 });
    
    let db = getDb();
    db = setValueByPath(db, dbPath, body);
    saveDb(db);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
