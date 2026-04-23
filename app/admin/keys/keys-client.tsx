"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PROVIDERS = ["anthropic", "openai", "firecrawl", "resend"] as const;
type Provider = (typeof PROVIDERS)[number];

interface ApiKeyRow {
  _id: string;
  provider: string;
  keyPreview: string;
  label: string;
  updatedAt: string | null;
  lastUsedAt: string | null;
}

export function KeysClient({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [keyVal, setKeyVal] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!keyVal.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key: keyVal, label }),
    });
    if (res.ok) {
      setKeyVal("");
      setLabel("");
      // Refresh list
      const list = await fetch("/api/admin/keys").then((r) => r.json()) as ApiKeyRow[];
      setKeys(list);
    }
    setSaving(false);
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke key này?")) return;
    await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k._id !== id));
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">API Keys</h1>

      {/* Add form */}
      <div className="mb-8 rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Thêm / cập nhật key</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex-[2]">
            <label className="mb-1 block text-sm font-medium">API Key</label>
            <Input
              type="password"
              value={keyVal}
              onChange={(e) => setKeyVal(e.target.value)}
              placeholder="sk-ant-..."
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Label (tuỳ chọn)</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Production key"
            />
          </div>
          <Button onClick={handleAdd} disabled={saving || !keyVal.trim()}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>

      {/* Key list */}
      <div className="flex flex-col gap-3">
        {keys.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có API key nào.</p>
        )}
        {keys.map((k) => (
          <div key={k._id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{k.provider}</Badge>
                <code className="text-sm">...{k.keyPreview}</code>
                {k.label && <span className="text-sm text-muted-foreground">{k.label}</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cập nhật: {k.updatedAt ? new Date(k.updatedAt).toLocaleDateString("vi-VN") : "—"}
                {k.lastUsedAt && (
                  <> · Dùng lần cuối: {new Date(k.lastUsedAt).toLocaleDateString("vi-VN")}</>
                )}
              </p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => handleRevoke(k._id)}>
              Revoke
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
