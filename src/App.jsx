import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, X, Upload, ArrowLeft, Shield, Star,
  Calendar, Trophy, Users, Newspaper, ChevronDown, ChevronUp,
  Crown, ClipboardList, Camera
} from "lucide-react";

/* ============================== მუდმივები ============================== */

const AGE_GROUPS = Array.from({ length: 21 }, (_, i) => 2010 + i); // 2010–2030

const TEAM_COLORS = [
  { name: "წითელი", hex: "#DC2626" },
  { name: "ლურჯი", hex: "#2563EB" },
  { name: "მწვანე", hex: "#16A34A" },
  { name: "ყვითელი", hex: "#EAB308" },
  { name: "ნარინჯისფერი", hex: "#EA580C" },
  { name: "იასამნისფერი", hex: "#9333EA" },
  { name: "ვარდისფერი", hex: "#EC4899" },
  { name: "ცისფერი", hex: "#0EA5E9" },
  { name: "შავი", hex: "#111827" },
  { name: "თეთრი", hex: "#F9FAFB" },
  { name: "ყავისფერი", hex: "#78350F" },
  { name: "ნაცრისფერი", hex: "#6B7280" },
];

const TABS = [
  { key: "news", label: "სიახლეები", icon: Newspaper },
  { key: "teams", label: "გუნდები", icon: Users },
  { key: "schedule", label: "განრიგი", icon: Calendar },
  { key: "results", label: "შედეგები", icon: ClipboardList },
  { key: "topscorers", label: "ბომბარდირები", icon: Trophy },
];

const STORAGE_KEYS = ["schools", "teams", "players", "news", "schedule", "results"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const todayStr = () => new Date().toISOString().slice(0, 10);

function resizeImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
          else { w = Math.round(w * (maxDim / h)); h = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("სურათის ჩატვირთვა ვერ მოხერხდა"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("ფაილის წაკითხვა ვერ მოხერხდა"));
    reader.readAsDataURL(file);
  });
}

/* ============================== საერთო UI ============================== */

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(15,23,42,0.55)" }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"}`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Oswald, sans-serif", letterSpacing: "0.02em" }}>
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.6)", zIndex: 70 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <p className="text-slate-700 mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium">
            გაუქმება
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-sm font-medium">
            წაშლა
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

function ImageUploader({ value, onChange, shape = "square", size = 88, hint }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await resizeImage(file, 600, 0.75);
      onChange(dataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex-shrink-0 ${shape === "circle" ? "rounded-full" : "rounded-xl"}`}
        style={{ width: size, height: size }}
      >
        {busy ? (
          <span className="text-xs text-slate-400">იტვირთება…</span>
        ) : value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-6 h-6 text-slate-400" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => inputRef.current && inputRef.current.click()}
          className="px-3 py-1.5 text-sm rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" /> სურათის ატვირთვა
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            მოცილება
          </button>
        )}
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

/* ============================== სკოლის ფორმა ============================== */

function SchoolFormModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const [logo, setLogo] = useState(initial ? initial.logo : null);
  const canSave = name.trim().length > 0;
  return (
    <Modal title={initial ? "სკოლის რედაქტირება" : "ახალი სკოლის დამატება"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="საფეხბურთო სკოლის დასახელება">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="მაგ: „ივერია“ საფეხბურთო აკადემია"
            autoFocus
          />
        </Field>
        <Field label="სკოლის ლოგო">
          <ImageUploader value={logo} onChange={setLogo} shape="square" />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium">
            გაუქმება
          </button>
          <button
            disabled={!canSave}
            onClick={() => onSave({ id: initial ? initial.id : uid(), name: name.trim(), logo })}
            className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            შენახვა
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================== სიახლის ფორმა ============================== */

function NewsFormModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial ? initial.title : "");
  const [text, setText] = useState(initial ? initial.text : "");
  const [image, setImage] = useState(initial ? initial.image : null);
  const canSave = title.trim().length > 0 && text.trim().length > 0;
  return (
    <Modal title={initial ? "სიახლის რედაქტირება" : "ახალი სიახლე"} onClose={onClose} wide>
      <div className="space-y-4">
        <Field label="სათაური">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="სიახლის სათაური" autoFocus />
        </Field>
        <Field label="ტექსტი">
          <textarea
            className={inputCls}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="სიახლის სრული ტექსტი…"
          />
        </Field>
        <Field label="სურათი (არასავალდებულო)">
          <ImageUploader value={image} onChange={setImage} shape="square" size={100} />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium">
            გაუქმება
          </button>
          <button
            disabled={!canSave}
            onClick={() =>
              onSave({
                id: initial ? initial.id : uid(),
                title: title.trim(),
                text: text.trim(),
                image,
                date: initial ? initial.date : todayStr(),
              })
            }
            className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-medium disabled:opacity-40"
          >
            შენახვა
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================== გუნდის ფორმა ============================== */

function TeamFormModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const [ageGroup, setAgeGroup] = useState(initial ? initial.ageGroup : AGE_GROUPS[0]);
  const [coach, setCoach] = useState(initial ? initial.coach : "");
  const [color, setColor] = useState(initial ? initial.color : TEAM_COLORS[0].hex);
  const canSave = name.trim().length > 0 && coach.trim().length > 0;
  return (
    <Modal title={initial ? "გუნდის რედაქტირება" : "ახალი გუნდის დამატება"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="გუნდის სახელი">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="მაგ: 2015 წლის გუნდი A" autoFocus />
        </Field>
        <Field label="ასაკობრივი ჯგუფი (დაბადების წელი)">
          <select className={inputCls} value={ageGroup} onChange={(e) => setAgeGroup(Number(e.target.value))}>
            {AGE_GROUPS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Field>
        <Field label="მწვრთნელის სახელი და გვარი">
          <input className={inputCls} value={coach} onChange={(e) => setCoach(e.target.value)} placeholder="მაგ: გიორგი გიორგაძე" />
        </Field>
        <Field label="გუნდის ფერი">
          <div className="flex flex-wrap gap-2 mt-1">
            {TEAM_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                onClick={() => setColor(c.hex)}
                className="rounded-full transition"
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: c.hex,
                  border: color === c.hex ? "3px solid #047857" : "2px solid #E2E8F0",
                  transform: color === c.hex ? "scale(1.1)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium">
            გაუქმება
          </button>
          <button
            disabled={!canSave}
            onClick={() => onSave({ id: initial ? initial.id : uid(), name: name.trim(), ageGroup, coach: coach.trim(), color })}
            className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-medium disabled:opacity-40"
          >
            შენახვა
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================== მოთამაშის ფორმა ============================== */

function PlayerFormModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const [number, setNumber] = useState(initial && initial.number != null ? String(initial.number) : "");
  const canSave = name.trim().length > 0;
  return (
    <Modal title={initial ? "მოთამაშის რედაქტირება" : "ახალი მოთამაშის დამატება"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="სახელი და გვარი">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="მაგ: ლუკა ლუკაშვილი" autoFocus />
        </Field>
        <Field label="ნომერი (არასავალდებულო)">
          <input className={inputCls} type="number" min="0" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="მაგ: 9" />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium">
            გაუქმება
          </button>
          <button
            disabled={!canSave}
            onClick={() =>
              onSave({
                id: initial ? initial.id : uid(),
                name: name.trim(),
                number: number === "" ? null : Number(number),
              })
            }
            className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-medium disabled:opacity-40"
          >
            შენახვა
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================== განრიგის ფორმა ============================== */

function ScheduleFormModal({ initial, presetType, teams, onSave, onClose }) {
  const [type, setType] = useState(initial ? initial.type : presetType || "match");
  const [ageGroup, setAgeGroup] = useState(initial ? initial.ageGroup : (teams[0] ? teams[0].ageGroup : AGE_GROUPS[0]));
  const [teamId, setTeamId] = useState(initial ? initial.teamId || "" : "");
  const [date, setDate] = useState(initial ? initial.date : todayStr());
  const [time, setTime] = useState(initial ? initial.time : "");
  const [opponent, setOpponent] = useState(initial ? initial.opponent || "" : "");
  const [homeAway, setHomeAway] = useState(initial ? initial.homeAway || "home" : "home");
  const [location, setLocation] = useState(initial ? initial.location || "" : "");
  const [notes, setNotes] = useState(initial ? initial.notes || "" : "");

  const groupTeams = teams.filter((t) => t.ageGroup === ageGroup);
  const canSave = date.trim().length > 0 && time.trim().length > 0;

  return (
    <Modal title={initial ? "განრიგის ჩანაწერის რედაქტირება" : type === "match" ? "მომავალი მატჩის დამატება" : "მომავალი ვარჯიშის დამატება"} onClose={onClose}>
      <div className="space-y-4">
        {!initial && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("match")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === "match" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-300"}`}
            >
              მატჩი
            </button>
            <button
              type="button"
              onClick={() => setType("training")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === "training" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-300"}`}
            >
              ვარჯიში
            </button>
          </div>
        )}
        <Field label="ასაკობრივი ჯგუფი">
          <select className={inputCls} value={ageGroup} onChange={(e) => { setAgeGroup(Number(e.target.value)); setTeamId(""); }}>
            {AGE_GROUPS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Field>
        <Field label="გუნდი (არასავალდებულო)">
          <select className={inputCls} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">— არ არის მითითებული —</option>
            {groupTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="თარიღი">
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="დრო">
            <input className={inputCls} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        {type === "match" ? (
          <>
            <Field label="მოწინააღმდეგე გუნდი">
              <input className={inputCls} value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="მოწინააღმდეგის დასახელება" />
            </Field>
            <Field label="მასპინძლობა">
              <div className="flex gap-2">
                <button type="button" onClick={() => setHomeAway("home")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${homeAway === "home" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-300"}`}>
                  სახლში
                </button>
                <button type="button" onClick={() => setHomeAway("away")} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${homeAway === "away" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-300"}`}>
                  გასვლაში
                </button>
              </div>
            </Field>
          </>
        ) : null}
        <Field label={type === "match" ? "მოედანი / მისამართი" : "ვარჯიშის ადგილი"}>
          <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="მისამართი ან სტადიონის დასახელება" />
        </Field>
        <Field label="შენიშვნა (არასავალდებულო)">
          <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium">
            გაუქმება
          </button>
          <button
            disabled={!canSave}
            onClick={() =>
              onSave({
                id: initial ? initial.id : uid(),
                type,
                ageGroup,
                teamId: teamId || null,
                date,
                time,
                opponent: type === "match" ? opponent.trim() : "",
                homeAway: type === "match" ? homeAway : null,
                location: location.trim(),
                notes: notes.trim(),
              })
            }
            className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-medium disabled:opacity-40"
          >
            შენახვა
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================== შედეგის ფორმა ============================== */

function RosterRow({ player, entry, onChange }) {
  const e = entry || { status: "none", gk: false, captain: false, note: "" };
  return (
    <div className="border border-slate-200 rounded-lg p-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex-shrink-0"
          style={{ width: 24, height: 24 }}
        >
          {player.number != null ? player.number : "•"}
        </span>
        <span className="text-sm text-slate-800 font-medium flex-1 min-w-0">{player.name}</span>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onChange(player.id, { status: e.status === "start" ? "none" : "start" })}
            className={`px-2 py-1 rounded text-xs font-medium ${e.status === "start" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            ძირითადი
          </button>
          <button
            type="button"
            onClick={() => onChange(player.id, { status: e.status === "sub" ? "none" : "sub" })}
            className={`px-2 py-1 rounded text-xs font-medium ${e.status === "sub" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            სათადარიგო
          </button>
          <button
            type="button"
            title="მეკარე"
            onClick={() => onChange(player.id, { gk: !e.gk })}
            className={`p-1.5 rounded ${e.gk ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"}`}
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="კაპიტანი"
            onClick={() => onChange(player.id, { captain: !e.captain })}
            className={`p-1.5 rounded ${e.captain ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"}`}
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <input
        className="w-full mt-2 border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        placeholder="შენიშვნა (არასავალდებულო)"
        value={e.note || ""}
        onChange={(ev) => onChange(player.id, { note: ev.target.value })}
      />
    </div>
  );
}

function TeamSideEditor({ label, mode, setMode, teamId, setTeamId, manualName, setManualName, groupTeams, teamsById, playersByTeam, roster, onRosterChange, goals, onAddGoal, onRemoveGoal, onGoalChange }) {
  const selectedTeam = teamId ? teamsById[teamId] : null;
  const sidePlayers = teamId ? playersByTeam[teamId] || [] : [];
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <h4 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>{label}</h4>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${mode === "existing" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-300"}`}
        >
          არსებული გუნდი
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${mode === "manual" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-300"}`}
        >
          ხელით შეყვანა
        </button>
      </div>
      {mode === "existing" ? (
        <div>
          <select className={inputCls} value={teamId || ""} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">აირჩიეთ გუნდი</option>
            {groupTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {selectedTeam && (
            <p className="text-xs text-slate-500 mt-1.5">მწვრთნელი: {selectedTeam.coach}</p>
          )}
        </div>
      ) : (
        <input className={inputCls} value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="გუნდის დასახელება" />
      )}

      {mode === "existing" && teamId && (
        <div className="pt-1">
          <p className="text-xs font-medium text-slate-500 mb-2">შემადგენლობა</p>
          {sidePlayers.length === 0 ? (
            <p className="text-xs text-slate-400">ამ გუნდს ჯერ არ ჰყავს დამატებული მოთამაშე</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {sidePlayers.map((p) => (
                <RosterRow key={p.id} player={p} entry={roster[p.id]} onChange={onRosterChange} />
              ))}
            </div>
          )}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">გოლების ავტორები</p>
              <button type="button" onClick={onAddGoal} className="text-emerald-700 text-xs font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" /> დამატება
              </button>
            </div>
            {goals.length === 0 ? (
              <p className="text-xs text-slate-400 mt-1">არცერთი გოლი არ არის მითითებული</p>
            ) : (
              <div className="space-y-1.5 mt-1.5">
                {goals.map((g) => (
                  <div key={g.id} className="flex items-center gap-2">
                    <select className={inputCls} value={g.playerId} onChange={(e) => onGoalChange(g.id, e.target.value)}>
                      <option value="">აირჩიეთ ფეხბურთელი</option>
                      {sidePlayers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => onRemoveGoal(g.id)} className="p-1.5 rounded hover:bg-rose-50 flex-shrink-0">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultFormModal({ initial, defaultAgeGroup, teams, players, onSave, onClose }) {
  const [tournament, setTournament] = useState(initial ? initial.tournament : "");
  const [date, setDate] = useState(initial ? initial.date : todayStr());
  const [ageGroup, setAgeGroup] = useState(initial ? initial.ageGroup : defaultAgeGroup || AGE_GROUPS[0]);
  const [homeMode, setHomeMode] = useState(initial ? initial.homeMode : "existing");
  const [homeTeamId, setHomeTeamId] = useState(initial ? initial.homeTeamId || "" : "");
  const [homeTeamName, setHomeTeamName] = useState(initial && initial.homeMode === "manual" ? initial.homeTeamName : "");
  const [awayMode, setAwayMode] = useState(initial ? initial.awayMode : "manual");
  const [awayTeamId, setAwayTeamId] = useState(initial ? initial.awayTeamId || "" : "");
  const [awayTeamName, setAwayTeamName] = useState(initial && initial.awayMode === "manual" ? initial.awayTeamName : "");
  const [homeScore, setHomeScore] = useState(initial ? initial.homeScore : 0);
  const [awayScore, setAwayScore] = useState(initial ? initial.awayScore : 0);
  const [roster, setRoster] = useState(initial ? initial.roster || {} : {});
  const [goals, setGoals] = useState(initial ? initial.goals || [] : []);

  const teamsById = {};
  teams.forEach((t) => { teamsById[t.id] = t; });
  const playersByTeam = {};
  players.forEach((p) => {
    if (!playersByTeam[p.teamId]) playersByTeam[p.teamId] = [];
    playersByTeam[p.teamId].push(p);
  });
  const groupTeams = teams.filter((t) => t.ageGroup === ageGroup);

  const updateRoster = (teamId, playerId, patch) => {
    setRoster((prev) => {
      const teamRoster = { ...(prev[teamId] || {}) };
      if (patch.gk === true) {
        Object.keys(teamRoster).forEach((pid) => { teamRoster[pid] = { ...teamRoster[pid], gk: false }; });
      }
      if (patch.captain === true) {
        Object.keys(teamRoster).forEach((pid) => { teamRoster[pid] = { ...teamRoster[pid], captain: false }; });
      }
      const existing = teamRoster[playerId] || { status: "none", gk: false, captain: false, note: "" };
      teamRoster[playerId] = { ...existing, ...patch };
      return { ...prev, [teamId]: teamRoster };
    });
  };

  const addGoal = (side) => {
    const teamId = side === "home" ? homeTeamId : awayTeamId;
    if (!teamId) return;
    setGoals((prev) => [...prev, { id: uid(), side, teamId, playerId: "" }]);
  };
  const removeGoal = (goalId) => setGoals((prev) => prev.filter((g) => g.id !== goalId));
  const changeGoal = (goalId, playerId) =>
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, playerId } : g)));

  const canSave =
    tournament.trim().length > 0 &&
    date.trim().length > 0 &&
    (homeMode === "existing" ? !!homeTeamId : homeTeamName.trim().length > 0) &&
    (awayMode === "existing" ? !!awayTeamId : awayTeamName.trim().length > 0);

  const handleSave = () => {
    const finalHomeName = homeMode === "existing" ? (teamsById[homeTeamId] ? teamsById[homeTeamId].name : "") : homeTeamName.trim();
    const finalAwayName = awayMode === "existing" ? (teamsById[awayTeamId] ? teamsById[awayTeamId].name : "") : awayTeamName.trim();
    onSave({
      id: initial ? initial.id : uid(),
      tournament: tournament.trim(),
      date,
      ageGroup,
      homeMode,
      homeTeamId: homeMode === "existing" ? homeTeamId : null,
      homeTeamName: finalHomeName,
      awayMode,
      awayTeamId: awayMode === "existing" ? awayTeamId : null,
      awayTeamName: finalAwayName,
      homeScore: Number(homeScore) || 0,
      awayScore: Number(awayScore) || 0,
      roster,
      goals: goals.filter((g) => g.playerId),
    });
  };

  return (
    <Modal title={initial ? "შედეგის რედაქტირება" : "მატჩის შედეგის დამატება"} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ჩემპიონატის / ტურნირის დასახელება">
            <input className={inputCls} value={tournament} onChange={(e) => setTournament(e.target.value)} placeholder="მაგ: თბილისის ჩემპიონატი" />
          </Field>
          <Field label="თარიღი">
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="ასაკობრივი ჯგუფი">
          <select
            className={inputCls}
            value={ageGroup}
            onChange={(e) => { setAgeGroup(Number(e.target.value)); setHomeTeamId(""); setAwayTeamId(""); }}
          >
            {AGE_GROUPS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <TeamSideEditor
            label="მასპინძელი გუნდი"
            mode={homeMode}
            setMode={setHomeMode}
            teamId={homeTeamId}
            setTeamId={setHomeTeamId}
            manualName={homeTeamName}
            setManualName={setHomeTeamName}
            groupTeams={groupTeams}
            teamsById={teamsById}
            playersByTeam={playersByTeam}
            roster={roster[homeTeamId] || {}}
            onRosterChange={(playerId, patch) => updateRoster(homeTeamId, playerId, patch)}
            goals={goals.filter((g) => g.side === "home")}
            onAddGoal={() => addGoal("home")}
            onRemoveGoal={removeGoal}
            onGoalChange={changeGoal}
          />
          <TeamSideEditor
            label="სტუმარი გუნდი"
            mode={awayMode}
            setMode={setAwayMode}
            teamId={awayTeamId}
            setTeamId={setAwayTeamId}
            manualName={awayTeamName}
            setManualName={setAwayTeamName}
            groupTeams={groupTeams}
            teamsById={teamsById}
            playersByTeam={playersByTeam}
            roster={roster[awayTeamId] || {}}
            onRosterChange={(playerId, patch) => updateRoster(awayTeamId, playerId, patch)}
            goals={goals.filter((g) => g.side === "away")}
            onAddGoal={() => addGoal("away")}
            onRemoveGoal={removeGoal}
            onGoalChange={changeGoal}
          />
        </div>

        <Field label="ანგარიში">
          <div className="flex items-center gap-3">
            <input className={`${inputCls} text-center`} type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} />
            <span className="text-slate-400 font-semibold">:</span>
            <input className={`${inputCls} text-center`} type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} />
          </div>
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium">
            გაუქმება
          </button>
          <button
            disabled={!canSave}
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-medium disabled:opacity-40"
          >
            შენახვა
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================== მთავარი აპლიკაცია ============================== */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [schools, setSchools] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [news, setNews] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [results, setResults] = useState([]);

  const [view, setView] = useState({ page: "home" });
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [expandedResult, setExpandedResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const setters = { schools: setSchools, teams: setTeams, players: setPlayers, news: setNews, schedule: setSchedule, results: setResults };
      for (const key of STORAGE_KEYS) {
        try {
          const r = await window.storage.get(key, false);
          if (!cancelled) setters[key](r ? JSON.parse(r.value) : []);
        } catch (e) {
          if (!cancelled) setters[key]([]);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback(async (key, value) => {
    try {
      const ok = await window.storage.set(key, JSON.stringify(value), false);
      if (!ok) throw new Error("no result");
    } catch (e) {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3500);
    }
  }, []);

  const addItem = (setter, key) => (item) => {
    setter((prev) => { const next = [...prev, item]; persist(key, next); return next; });
  };
  const updateItem = (setter, key) => (item) => {
    setter((prev) => { const next = prev.map((x) => (x.id === item.id ? item : x)); persist(key, next); return next; });
  };
  const removeWhere = (setter, key) => (predicate) => {
    setter((prev) => { const next = prev.filter((x) => !predicate(x)); persist(key, next); return next; });
  };

  const schoolActions = { add: addItem(setSchools, "schools"), update: updateItem(setSchools, "schools"), removeWhere: removeWhere(setSchools, "schools") };
  const teamActions = { add: addItem(setTeams, "teams"), update: updateItem(setTeams, "teams"), removeWhere: removeWhere(setTeams, "teams") };
  const playerActions = { add: addItem(setPlayers, "players"), update: updateItem(setPlayers, "players"), removeWhere: removeWhere(setPlayers, "players") };
  const newsActions = { add: addItem(setNews, "news"), update: updateItem(setNews, "news"), removeWhere: removeWhere(setNews, "news") };
  const scheduleActions = { add: addItem(setSchedule, "schedule"), update: updateItem(setSchedule, "schedule"), removeWhere: removeWhere(setSchedule, "schedule") };
  const resultActions = { add: addItem(setResults, "results"), update: updateItem(setResults, "results"), removeWhere: removeWhere(setResults, "results") };

  const saveGeneric = (actions) => (item, mode) => {
    if (mode === "edit") actions.update(item); else actions.add(item);
    setModal(null);
  };

  /* --------- წაშლის დამხმარეები (კასკადური) --------- */

  const deleteSchool = (schoolId) => {
    setConfirm({
      message: "დარწმუნებული ხართ, რომ გსურთ ამ სკოლის წაშლა? წაიშლება ყველა დაკავშირებული გუნდი, მოთამაშე, სიახლე, განრიგისა და შედეგების ჩანაწერი.",
      onConfirm: () => {
        const teamIds = teams.filter((t) => t.schoolId === schoolId).map((t) => t.id);
        playerActions.removeWhere((p) => teamIds.includes(p.teamId));
        teamActions.removeWhere((t) => t.schoolId === schoolId);
        newsActions.removeWhere((n) => n.schoolId === schoolId);
        scheduleActions.removeWhere((s) => s.schoolId === schoolId);
        resultActions.removeWhere((r) => r.schoolId === schoolId);
        schoolActions.removeWhere((s) => s.id === schoolId);
        setView({ page: "home" });
        setConfirm(null);
      },
    });
  };

  const deleteTeam = (teamId) => {
    setConfirm({
      message: "გუნდის წაშლისას წაიშლება მასთან დაკავშირებული მოთამაშეებიც. გავაგრძელოთ?",
      onConfirm: () => {
        playerActions.removeWhere((p) => p.teamId === teamId);
        teamActions.removeWhere((t) => t.id === teamId);
        setConfirm(null);
      },
    });
  };

  const deleteSimple = (actions, id, message) => {
    setConfirm({
      message: message || "დარწმუნებული ხართ, რომ გსურთ წაშლა?",
      onConfirm: () => { actions.removeWhere((x) => x.id === id); setConfirm(null); },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">იტვირთება…</p>
        </div>
      </div>
    );
  }

  const activeSchool = view.page === "school" ? schools.find((s) => s.id === view.schoolId) : null;

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <header
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #14532d 60%, #052e22 100%)",
          backgroundImage:
            "repeating-linear-gradient(100deg, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 42px, transparent 42px, transparent 84px), linear-gradient(135deg, #064e3b 0%, #14532d 60%, #052e22 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-5">
          {view.page === "home" ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-white text-xl font-semibold" style={{ fontFamily: "Oswald, sans-serif", letterSpacing: "0.02em" }}>
                  საფეხბურთო სკოლების პორტალი
                </h1>
                <p className="text-emerald-100/70 text-sm">მართეთ სკოლები, გუნდები, განრიგი და შედეგები ერთ სივრცეში</p>
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => setView({ page: "home" })} className="flex items-center gap-1.5 text-emerald-100/80 hover:text-white text-sm mb-3">
                <ArrowLeft className="w-4 h-4" /> სკოლების სია
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                  {activeSchool && activeSchool.logo ? (
                    <img src={activeSchool.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-7 h-7 text-amber-400" />
                  )}
                </div>
                <h1 className="text-white text-xl font-semibold" style={{ fontFamily: "Oswald, sans-serif", letterSpacing: "0.02em" }}>
                  {activeSchool ? activeSchool.name : ""}
                </h1>
              </div>
            </div>
          )}
        </div>
        {view.page === "school" && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto -mb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = view.tab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setView({ ...view, tab: tab.key })}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                      active ? "border-amber-400 text-white" : "border-transparent text-emerald-100/60 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {saveError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-700 text-sm text-center py-2">
          შენახვისას მოხდა შეცდომა — შეამოწმეთ ინტერნეტკავშირი და სცადეთ ხელახლა.
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view.page === "home" && (
          <HomePage
            schools={schools}
            onOpen={(id) => setView({ page: "school", schoolId: id, tab: "news" })}
            onAdd={() => setModal({ type: "school", mode: "add" })}
            onEdit={(s) => setModal({ type: "school", mode: "edit", data: s })}
            onDelete={deleteSchool}
          />
        )}

        {view.page === "school" && activeSchool && view.tab === "news" && (
          <NewsTab
            items={news.filter((n) => n.schoolId === activeSchool.id).sort((a, b) => (a.date < b.date ? 1 : -1))}
            onAdd={() => setModal({ type: "news", mode: "add", schoolId: activeSchool.id })}
            onEdit={(n) => setModal({ type: "news", mode: "edit", data: n, schoolId: activeSchool.id })}
            onDelete={(id) => deleteSimple(newsActions, id, "წავშალო ეს სიახლე?")}
          />
        )}

        {view.page === "school" && activeSchool && view.tab === "teams" && (
          <TeamsTab
            teams={teams.filter((t) => t.schoolId === activeSchool.id)}
            players={players}
            expandedTeam={expandedTeam}
            setExpandedTeam={setExpandedTeam}
            onAddTeam={() => setModal({ type: "team", mode: "add", schoolId: activeSchool.id })}
            onEditTeam={(t) => setModal({ type: "team", mode: "edit", data: t, schoolId: activeSchool.id })}
            onDeleteTeam={deleteTeam}
            onAddPlayer={(teamId) => setModal({ type: "player", mode: "add", teamId })}
            onEditPlayer={(p) => setModal({ type: "player", mode: "edit", data: p, teamId: p.teamId })}
            onDeletePlayer={(id) => deleteSimple(playerActions, id, "წავშალო ეს მოთამაშე?")}
          />
        )}

        {view.page === "school" && activeSchool && view.tab === "schedule" && (
          <ScheduleTab
            items={schedule.filter((s) => s.schoolId === activeSchool.id)}
            teams={teams.filter((t) => t.schoolId === activeSchool.id)}
            onAddMatch={() => setModal({ type: "schedule", mode: "add", schoolId: activeSchool.id, presetType: "match" })}
            onAddTraining={() => setModal({ type: "schedule", mode: "add", schoolId: activeSchool.id, presetType: "training" })}
            onEdit={(item) => setModal({ type: "schedule", mode: "edit", data: item, schoolId: activeSchool.id })}
            onDelete={(id) => deleteSimple(scheduleActions, id, "წავშალო ეს ჩანაწერი?")}
          />
        )}

        {view.page === "school" && activeSchool && view.tab === "results" && (
          <ResultsTab
            items={results.filter((r) => r.schoolId === activeSchool.id)}
            teams={teams.filter((t) => t.schoolId === activeSchool.id)}
            players={players}
            expandedResult={expandedResult}
            setExpandedResult={setExpandedResult}
            onAdd={() => setModal({ type: "result", mode: "add", schoolId: activeSchool.id })}
            onEdit={(r) => setModal({ type: "result", mode: "edit", data: r, schoolId: activeSchool.id })}
            onDelete={(id) => deleteSimple(resultActions, id, "წავშალო ეს შედეგი?")}
          />
        )}

        {view.page === "school" && activeSchool && view.tab === "topscorers" && (
          <TopScorersTab
            results={results.filter((r) => r.schoolId === activeSchool.id)}
            players={players}
            teams={teams.filter((t) => t.schoolId === activeSchool.id)}
          />
        )}
      </main>

      {/* --------- მოდალები --------- */}

      {modal && modal.type === "school" && (
        <SchoolFormModal
          initial={modal.mode === "edit" ? modal.data : null}
          onClose={() => setModal(null)}
          onSave={(item) => saveGeneric(schoolActions)(item, modal.mode)}
        />
      )}

      {modal && modal.type === "news" && (
        <NewsFormModal
          initial={modal.mode === "edit" ? modal.data : null}
          onClose={() => setModal(null)}
          onSave={(item) => saveGeneric(newsActions)({ ...item, schoolId: modal.schoolId }, modal.mode)}
        />
      )}

      {modal && modal.type === "team" && (
        <TeamFormModal
          initial={modal.mode === "edit" ? modal.data : null}
          onClose={() => setModal(null)}
          onSave={(item) => saveGeneric(teamActions)({ ...item, schoolId: modal.schoolId }, modal.mode)}
        />
      )}

      {modal && modal.type === "player" && (
        <PlayerFormModal
          initial={modal.mode === "edit" ? modal.data : null}
          onClose={() => setModal(null)}
          onSave={(item) => saveGeneric(playerActions)({ ...item, teamId: modal.teamId }, modal.mode)}
        />
      )}

      {modal && modal.type === "schedule" && (
        <ScheduleFormModal
          initial={modal.mode === "edit" ? modal.data : null}
          presetType={modal.presetType}
          teams={teams.filter((t) => t.schoolId === modal.schoolId)}
          onClose={() => setModal(null)}
          onSave={(item) => saveGeneric(scheduleActions)({ ...item, schoolId: modal.schoolId }, modal.mode)}
        />
      )}

      {modal && modal.type === "result" && (
        <ResultFormModal
          initial={modal.mode === "edit" ? modal.data : null}
          defaultAgeGroup={
            modal.mode === "edit"
              ? modal.data.ageGroup
              : (teams.filter((t) => t.schoolId === modal.schoolId)[0] || {}).ageGroup
          }
          teams={teams.filter((t) => t.schoolId === modal.schoolId)}
          players={players}
          onClose={() => setModal(null)}
          onSave={(item) => saveGeneric(resultActions)({ ...item, schoolId: modal.schoolId }, modal.mode)}
        />
      )}

      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== მთავარი გვერდი ============================== */

function HomePage({ schools, onOpen, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl text-slate-800 font-semibold" style={{ fontFamily: "Oswald, sans-serif" }}>საფეხბურთო სკოლები</h2>
          <p className="text-slate-500 text-sm mt-1">აირჩიეთ სკოლა ან დაამატეთ ახალი</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 shadow-sm text-sm">
          <Plus className="w-4 h-4" /> დაამატე სკოლა
        </button>
      </div>

      {schools.length === 0 ? (
        <div className="text-center py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>ჯერ არცერთი სკოლა არ დამატებულა</p>
          <p className="text-sm mt-1">დააჭირეთ „დაამატე სკოლა“-ს დასაწყებად</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {schools.map((s) => (
            <div key={s.id} className="group relative flex flex-col items-center">
              <button
                onClick={() => onOpen(s.id)}
                className="rounded-2xl overflow-hidden bg-white border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition flex items-center justify-center"
                style={{ width: 112, height: 112 }}
              >
                {s.logo ? (
                  <img src={s.logo} className="w-full h-full object-cover" alt={s.name} />
                ) : (
                  <span className="text-2xl text-emerald-700 font-semibold" style={{ fontFamily: "Oswald, sans-serif" }}>
                    {s.name.slice(0, 2)}
                  </span>
                )}
              </button>
              <span className="mt-2 text-sm font-medium text-slate-700 text-center">{s.name}</span>
              <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                <button onClick={() => onEdit(s)} className="p-1.5 rounded-full bg-white shadow border border-slate-200 hover:bg-slate-50">
                  <Pencil className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button onClick={() => onDelete(s.id)} className="p-1.5 rounded-full bg-white shadow border border-slate-200 hover:bg-rose-50">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== სიახლეების ტაბი ============================== */

function NewsTab({ items, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl text-slate-800 font-semibold" style={{ fontFamily: "Oswald, sans-serif" }}>სიახლეები</h2>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 text-sm">
          <Plus className="w-4 h-4" /> სიახლის დამატება
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState text="სიახლეები ჯერ არ დამატებულა" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((n) => (
            <div key={n.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {n.image && <img src={n.image} alt="" className="w-full object-cover" style={{ height: 160 }} />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">{n.title}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onEdit(n)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-500" /></button>
                    <button onClick={() => onDelete(n.id)} className="p-1.5 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">{n.date}</p>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{n.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== გუნდების ტაბი ============================== */

function TeamsTab({ teams, players, expandedTeam, setExpandedTeam, onAddTeam, onEditTeam, onDeleteTeam, onAddPlayer, onEditPlayer, onDeletePlayer }) {
  const groups = {};
  teams.forEach((t) => {
    if (!groups[t.ageGroup]) groups[t.ageGroup] = [];
    groups[t.ageGroup].push(t);
  });
  const ageKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl text-slate-800 font-semibold" style={{ fontFamily: "Oswald, sans-serif" }}>გუნდები</h2>
        <button onClick={onAddTeam} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 text-sm">
          <Plus className="w-4 h-4" /> დაამატე გუნდი
        </button>
      </div>
      {teams.length === 0 ? (
        <EmptyState text="გუნდები ჯერ არ დამატებულა" />
      ) : (
        <div className="space-y-6">
          {ageKeys.map((age) => (
            <div key={age}>
              <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">{age} წლის გუნდები</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {groups[age].map((t) => {
                  const teamPlayers = players.filter((p) => p.teamId === t.id);
                  const isOpen = expandedTeam === t.id;
                  return (
                    <div key={t.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="p-4 flex items-center gap-3">
                        <span className="rounded-full flex-shrink-0" style={{ width: 20, height: 20, backgroundColor: t.color, border: "1px solid rgba(0,0,0,0.1)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{t.name}</p>
                          <p className="text-xs text-slate-500">მწვრთნელი: {t.coach}</p>
                        </div>
                        <button onClick={() => onEditTeam(t)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-500" /></button>
                        <button onClick={() => onDeleteTeam(t.id)} className="p-1.5 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                      </div>
                      <button
                        onClick={() => setExpandedTeam(isOpen ? null : t.id)}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-500 border-t border-slate-100 hover:bg-slate-50"
                      >
                        <span>მოთამაშეები ({teamPlayers.length})</span>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                          {teamPlayers.length === 0 ? (
                            <p className="text-xs text-slate-400 mb-2">მოთამაშეები ჯერ არ დამატებულა</p>
                          ) : (
                            <div className="space-y-1.5 mb-3">
                              {teamPlayers.map((p) => (
                                <div key={p.id} className="flex items-center gap-2 text-sm">
                                  <span className="flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex-shrink-0" style={{ width: 22, height: 22 }}>
                                    {p.number != null ? p.number : "•"}
                                  </span>
                                  <span className="flex-1 text-slate-700">{p.name}</span>
                                  <button onClick={() => onEditPlayer(p)} className="p-1 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-400" /></button>
                                  <button onClick={() => onDeletePlayer(p.id)} className="p-1 rounded hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 text-rose-400" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                          <button onClick={() => onAddPlayer(t.id)} className="flex items-center gap-1 text-emerald-700 text-xs font-medium">
                            <Plus className="w-3.5 h-3.5" /> მოთამაშის დამატება
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== განრიგის ტაბი ============================== */

function ScheduleTab({ items, teams, onAddMatch, onAddTraining, onEdit, onDelete }) {
  const groups = {};
  items.forEach((it) => {
    if (!groups[it.ageGroup]) groups[it.ageGroup] = [];
    groups[it.ageGroup].push(it);
  });
  const ageKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
  const teamsById = {};
  teams.forEach((t) => { teamsById[t.id] = t; });

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-xl text-slate-800 font-semibold" style={{ fontFamily: "Oswald, sans-serif" }}>განრიგი</h2>
        <div className="flex gap-2">
          <button onClick={onAddMatch} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 text-sm">
            <Plus className="w-4 h-4" /> მატჩის დამატება
          </button>
          <button onClick={onAddTraining} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 text-sm">
            <Plus className="w-4 h-4" /> ვარჯიშის დამატება
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState text="განრიგში ჩანაწერები ჯერ არ არის" />
      ) : (
        <div className="space-y-6">
          {ageKeys.map((age) => {
            const sorted = groups[age].slice().sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1));
            return (
              <div key={age}>
                <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">{age} წლის ჯგუფი</h3>
                <div className="space-y-2">
                  {sorted.map((it) => {
                    const team = it.teamId ? teamsById[it.teamId] : null;
                    return (
                      <div key={it.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${it.type === "match" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>
                          {it.type === "match" ? "მატჩი" : "ვარჯიში"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800">
                            {it.type === "match" ? (it.opponent ? `${team ? team.name : "ჩვენი გუნდი"} — ${it.opponent}` : team ? team.name : "მატჩი") : team ? team.name : "ვარჯიში"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {it.date} {it.time && `• ${it.time}`} {it.location && `• ${it.location}`}
                            {it.type === "match" && it.homeAway && ` • ${it.homeAway === "home" ? "სახლში" : "გასვლაში"}`}
                          </p>
                          {it.notes && <p className="text-xs text-slate-400 mt-0.5">{it.notes}</p>}
                        </div>
                        <button onClick={() => onEdit(it)} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"><Pencil className="w-4 h-4 text-slate-500" /></button>
                        <button onClick={() => onDelete(it.id)} className="p-1.5 rounded-lg hover:bg-rose-50 flex-shrink-0"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================== შედეგების ტაბი ============================== */

function ResultsTab({ items, teams, players, expandedResult, setExpandedResult, onAdd, onEdit, onDelete }) {
  const groups = {};
  items.forEach((r) => {
    if (!groups[r.ageGroup]) groups[r.ageGroup] = [];
    groups[r.ageGroup].push(r);
  });
  const ageKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
  const playersById = {};
  players.forEach((p) => { playersById[p.id] = p; });

  const renderLineup = (teamId, roster) => {
    if (!teamId) return null;
    const teamPlayers = players.filter((p) => p.teamId === teamId);
    const starters = teamPlayers.filter((p) => roster[p.id] && roster[p.id].status === "start");
    const subs = teamPlayers.filter((p) => roster[p.id] && roster[p.id].status === "sub");
    if (starters.length === 0 && subs.length === 0) return <p className="text-xs text-slate-400">შემადგენლობა არ არის მითითებული</p>;
    const renderPlayer = (p) => {
      const e = roster[p.id] || {};
      return (
        <span key={p.id} className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded-full px-2 py-1 mr-1 mb-1">
          {p.name}
          {e.gk && <Shield className="w-3 h-3 text-sky-600" />}
          {e.captain && <Star className="w-3 h-3 text-amber-500" />}
        </span>
      );
    };
    return (
      <div>
        {starters.length > 0 && (
          <div className="mb-1.5"><p className="text-xs text-slate-500 mb-1">ძირითადი შემადგენლობა:</p><div className="flex flex-wrap">{starters.map(renderPlayer)}</div></div>
        )}
        {subs.length > 0 && (
          <div><p className="text-xs text-slate-500 mb-1">სათადარიგო:</p><div className="flex flex-wrap">{subs.map(renderPlayer)}</div></div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl text-slate-800 font-semibold" style={{ fontFamily: "Oswald, sans-serif" }}>შედეგები</h2>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 text-sm">
          <Plus className="w-4 h-4" /> შედეგის დამატება
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState text="შედეგები ჯერ არ დამატებულა" />
      ) : (
        <div className="space-y-6">
          {ageKeys.map((age) => {
            const sorted = groups[age].slice().sort((a, b) => (a.date < b.date ? 1 : -1));
            return (
              <div key={age}>
                <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">{age} წლის ჯგუფი</h3>
                <div className="space-y-2">
                  {sorted.map((r) => {
                    const isOpen = expandedResult === r.id;
                    const homeGoals = r.goals.filter((g) => g.side === "home");
                    const awayGoals = r.goals.filter((g) => g.side === "away");
                    return (
                      <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400">{r.tournament} • {r.date}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="font-medium text-slate-800 truncate">{r.homeTeamName}</span>
                              <span className="font-semibold text-slate-800 flex-shrink-0" style={{ fontFamily: "Oswald, sans-serif" }}>{r.homeScore} : {r.awayScore}</span>
                              <span className="font-medium text-slate-800 truncate">{r.awayTeamName}</span>
                            </div>
                          </div>
                          <button onClick={() => onEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"><Pencil className="w-4 h-4 text-slate-500" /></button>
                          <button onClick={() => onDelete(r.id)} className="p-1.5 rounded-lg hover:bg-rose-50 flex-shrink-0"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                          <button onClick={() => setExpandedResult(isOpen ? null : r.id)} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0">
                            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </button>
                        </div>
                        {isOpen && (
                          <div className="border-t border-slate-100 p-4 grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1.5">{r.homeTeamName}</p>
                              {renderLineup(r.homeTeamId, r.roster[r.homeTeamId] || {})}
                              {homeGoals.length > 0 && (
                                <p className="text-xs text-slate-500 mt-2">
                                  გოლები: {homeGoals.map((g) => (playersById[g.playerId] ? playersById[g.playerId].name : "წაშლილი მოთამაშე")).join(", ")}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1.5">{r.awayTeamName}</p>
                              {renderLineup(r.awayTeamId, r.roster[r.awayTeamId] || {})}
                              {awayGoals.length > 0 && (
                                <p className="text-xs text-slate-500 mt-2">
                                  გოლები: {awayGoals.map((g) => (playersById[g.playerId] ? playersById[g.playerId].name : "წაშლილი მოთამაშე")).join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================== ბომბარდირების ტაბი ============================== */

function TopScorersTab({ results, players, teams }) {
  const playersById = {};
  players.forEach((p) => { playersById[p.id] = p; });
  const teamsById = {};
  teams.forEach((t) => { teamsById[t.id] = t; });

  const groups = {};
  results.forEach((r) => {
    if (!groups[r.ageGroup]) groups[r.ageGroup] = {};
    r.goals.forEach((g) => {
      const key = g.playerId;
      if (!groups[r.ageGroup][key]) groups[r.ageGroup][key] = { playerId: g.playerId, teamId: g.teamId, count: 0 };
      groups[r.ageGroup][key].count += 1;
    });
  });
  const ageKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);

  return (
    <div>
      <h2 className="text-xl text-slate-800 font-semibold mb-5" style={{ fontFamily: "Oswald, sans-serif" }}>ბომბარდირები</h2>
      {ageKeys.length === 0 ? (
        <EmptyState text="ჯერ არცერთი გოლი არ არის დაფიქსირებული" />
      ) : (
        <div className="space-y-6">
          {ageKeys.map((age) => {
            const list = Object.values(groups[age]).sort((a, b) => b.count - a.count);
            return (
              <div key={age}>
                <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">{age} წლის ჯგუფი</h3>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {list.map((row, idx) => {
                    const player = playersById[row.playerId];
                    const team = teamsById[row.teamId];
                    return (
                      <div key={row.playerId} className={`flex items-center gap-3 px-4 py-3 ${idx !== list.length - 1 ? "border-b border-slate-100" : ""}`}>
                        <span
                          className="flex items-center justify-center rounded-full text-sm font-semibold flex-shrink-0"
                          style={{
                            width: 30, height: 30,
                            backgroundColor: idx === 0 ? "#FBBF24" : idx === 1 ? "#CBD5E1" : idx === 2 ? "#D97706" : "#F1F5F9",
                            color: idx <= 2 ? "#ffffff" : "#64748B",
                          }}
                        >
                          {idx + 1}
                        </span>
                        {idx === 0 && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{player ? player.name : "წაშლილი მოთამაშე"}</p>
                          <p className="text-xs text-slate-500">{team ? team.name : ""}</p>
                        </div>
                        <span className="font-semibold text-emerald-700 flex-shrink-0" style={{ fontFamily: "Oswald, sans-serif" }}>{row.count} გოლი</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================== დამხმარე ============================== */

function EmptyState({ text }) {
  return (
    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
      <p>{text}</p>
    </div>
  );
}
