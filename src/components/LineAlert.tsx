import { useEffect, useState } from "react";
import { api, hostOf, platform, type LineState } from "../api";
import { useStore } from "../store";
import LinePicker from "./LinePicker";
import { IBoltF, IClose, IRefresh } from "../icons";

export default function LineAlert() {
  const { toast, push } = useStore();
  const [checking, setChecking] = useState(true);
  const [failed, setFailed] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [lineBase, setLineBase] = useState("");

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const state: LineState = await api.lineState();
        if (!alive) return;
        setLineBase(state.base);
        const probes = await api.lineProbe([state.base]);
        if (!alive) return;
        const ok = probes.some((p) => p.ok);
        setFailed(!ok);
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setChecking(false);
      }
    };
    check();
    return () => { alive = false; };
  }, []);

  const retry = async () => {
    setChecking(true);
    setFailed(false);
    try {
      const state = await api.lineState();
      setLineBase(state.base);
      const probes = await api.lineProbe([state.base]);
      const ok = probes.some((p) => p.ok);
      setFailed(!ok);
      if (ok) {
        toast("线路连接正常", "ok");
        setDismissed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  };

  const openLinePicker = () => {
    if (platform === "android") {
      push({ kind: "settings" });
    } else {
      setLineOpen(true);
    }
  };

  const onLineClose = () => {
    setLineOpen(false);
    retry();
  };

  if (dismissed || checking || !failed) return null;

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-50 px-3" style={{ paddingTop: "calc(var(--sat, 0px) + 8px)" }}>
        <div className="mx-auto max-w-lg bg-danger/95 backdrop-blur-md rounded-(--r-md) p-3 elev-2 a-toast">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <IBoltF size={16} className="text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white leading-tight">网络连接失败</div>
              <div className="text-[11px] text-white/80 mt-1 leading-relaxed">
                无法连接到 {hostOf(lineBase) || "默认线路"}，请切换线路或检查网络
              </div>
              <div className="flex gap-2 mt-2.5">
                <button onClick={openLinePicker}
                  className="h-7 px-3 rounded-(--r-sm) bg-white text-danger text-[11.5px] font-semibold pressable">
                  切换线路
                </button>
                <button onClick={retry} disabled={checking}
                  className="h-7 px-3 rounded-(--r-sm) bg-white/20 text-white text-[11.5px] font-medium pressable flex items-center gap-1.5 disabled:opacity-60">
                  <IRefresh size={12} />{checking ? "检测中…" : "重试"}
                </button>
              </div>
            </div>
            <button onClick={() => setDismissed(true)} aria-label="关闭" className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white/70 hover:text-white pressable">
              <IClose size={14} />
            </button>
          </div>
        </div>
      </div>
      <LinePicker open={lineOpen} onClose={onLineClose} />
    </>
  );
}
