"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Agent {
  _id: string;
  name: string;
  topic: string;
  sources: string[];
  schedule: string;
  model: string;
  autoPublish: boolean;
  active: boolean;
  dailyTokenLimit: number;
  lastRunAt: string | null;
  createdAt: string | null;
}

const EMPTY: Omit<Agent, "_id" | "lastRunAt" | "createdAt"> = {
  name: "",
  topic: "general",
  sources: [],
  schedule: "0 8 * * *",
  model: "claude-sonnet-4-6",
  autoPublish: false,
  active: true,
  dailyTokenLimit: 200_000,
};

export function AgentsClient({ initialAgents }: { initialAgents: Agent[] }) {
  const [agents, setAgents] = useState(initialAgents);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [sourcesText, setSourcesText] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [runMsg, setRunMsg] = useState<Record<string, string>>({});

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setSourcesText("");
    setOpen(true);
  }

  function openEdit(a: Agent) {
    setEditing(a);
    setForm({
      name: a.name,
      topic: a.topic,
      sources: a.sources,
      schedule: a.schedule,
      model: a.model,
      autoPublish: a.autoPublish,
      active: a.active,
      dailyTokenLimit: a.dailyTokenLimit,
    });
    setSourcesText(a.sources.join("\n"));
    setOpen(true);
  }

  async function handleSave() {
    const payload = { ...form, sources: sourcesText.split("\n").map((s) => s.trim()).filter(Boolean) };
    if (editing) {
      const res = await fetch(`/api/admin/agents/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json() as Agent & { _id: string };
      setAgents((prev) => prev.map((a) => (a._id === editing._id ? { ...updated, _id: String(updated._id) } : a)));
    } else {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json() as Agent & { _id: string };
      setAgents((prev) => [{ ...created, _id: String(created._id) }, ...prev]);
    }
    setOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xoá agent này?")) return;
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    setAgents((prev) => prev.filter((a) => a._id !== id));
  }

  async function handleRun(id: string) {
    setRunning(id);
    setRunMsg((p) => ({ ...p, [id]: "Đang chạy..." }));
    const res = await fetch(`/api/admin/agents/${id}/run`, { method: "POST" });
    const data = await res.json() as { postsCreated?: number; errors?: string[] };
    const msg = res.ok
      ? `✓ Tạo ${data.postsCreated ?? 0} bài${data.errors?.length ? ` | Lỗi: ${data.errors.join("; ")}` : ""}`
      : `✗ ${String((data as { error?: string }).error ?? "unknown")}`;
    setRunMsg((p) => ({ ...p, [id]: msg }));
    setRunning(null);
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/admin/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setAgents((prev) => prev.map((a) => (a._id === id ? { ...a, active } : a)));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Agents</h1>
        <Button onClick={openCreate}>+ Tạo agent</Button>
      </div>

      <div className="flex flex-col gap-3">
        {agents.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có agent nào. Tạo agent đầu tiên!</p>
        )}
        {agents.map((a) => (
          <div key={a._id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{a.name}</span>
                  <Badge variant={a.active ? "default" : "secondary"}>
                    {a.active ? "Active" : "Paused"}
                  </Badge>
                  <Badge variant="outline">{a.topic}</Badge>
                  {a.autoPublish && <Badge variant="outline">Auto-publish</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Model: {a.model} · Schedule: {a.schedule} · Sources: {a.sources.length}
                </p>
                {a.lastRunAt && (
                  <p className="text-xs text-muted-foreground">
                    Chạy lần cuối: {new Date(a.lastRunAt).toLocaleString("vi-VN")}
                  </p>
                )}
                {runMsg[a._id] && (
                  <p className="mt-1 text-xs font-medium text-foreground">{runMsg[a._id]}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRun(a._id)}
                  disabled={running === a._id}
                >
                  {running === a._id ? "..." : "Run"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(a._id, !a.active)}
                >
                  {a.active ? "Tắt" : "Bật"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(a._id)}>
                  Xoá
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa agent" : "Tạo agent mới"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <label className="text-sm font-medium">Tên</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Tech News Agent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Topic</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={form.topic}
                  onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                >
                  {["general", "tech", "kinh-te", "the-thao", "giai-tri"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Model</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={form.model}
                  onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                >
                  <option value="claude-sonnet-4-6">Sonnet 4.6</option>
                  <option value="claude-haiku-4-5">Haiku 4.5</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Schedule (cron)</label>
              <Input
                value={form.schedule}
                onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))}
                placeholder="0 8 * * *"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sources (mỗi dòng 1 URL)</label>
              <Textarea
                rows={4}
                value={sourcesText}
                onChange={(e) => setSourcesText(e.target.value)}
                placeholder="https://feeds.feedburner.com/TechCrunch/"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.autoPublish}
                  onChange={(e) => setForm((p) => ({ ...p, autoPublish: e.target.checked }))}
                />
                Auto-publish
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
              <Button onClick={handleSave}>{editing ? "Lưu" : "Tạo"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
