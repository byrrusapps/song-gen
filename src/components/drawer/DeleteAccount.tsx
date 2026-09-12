import { createSignal } from "solid-js";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../lib/firebase/init/InitFirebase";
import { useNavigate } from "@solidjs/router";
import SignOut from "../../lib/auth/SignOut";
import { useApp } from "../../context/app/App";

const DeleteAccount = () => {
  const { newMsgs, setMsgList, setDrawer, setIsDeleting } = useApp();
  const navigate = useNavigate();

  const [confirm, setConfirm]   = createSignal("");
  const [loading, setLoading]   = createSignal(false);

  const deleteAccountFn = httpsCallable<{}, { success: boolean }>(functions, "deleteAccount");

  const isConfirmed = () => confirm().trim().toLowerCase() === "delete";

  async function handleDelete() {
    if (!isConfirmed()) return;
    setLoading(true);
    setIsDeleting(true);

    try {
      await deleteAccountFn({});
      SignOut({ setMsgList });
      setDrawer(false);
      setIsDeleting(false);
      navigate("/");
    } catch {
      newMsgs([{
        msg: "Failed to delete account. Please try again.",
        type: "error",
        open: false,
      }])
      setIsDeleting(false);
    } finally {
      setLoading(false);
      setIsDeleting(false);
    }
  }

  return (
    <>
      {/* ── Sticky header ── */}
      <div class="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 px-6 py-4 flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
          <span class="material-symbols-rounded text-lg">no_accounts</span>
        </div>
        <div>
          <p class="text-sm font-black tracking-tight">Delete account</p>
          <p class="text-[10px] text-on-surface-variant opacity-60 font-medium">This cannot be undone</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div class="relative flex flex-col gap-6 p-6">

        {/* Warning card */}
        <div class="flex flex-col gap-3 p-5 rounded-2xl bg-error/5 border border-error/20">
          <p class="text-xs font-black uppercase tracking-widest text-error/70">What gets deleted</p>
          <div class="flex flex-col gap-2">
            {[
              "Your account and profile",
              "All saved resumes and data",
              "Your active Pro subscription",
              "Your unique @tag",
            ].map((item) => (
              <div class="flex items-center gap-2.5 text-sm text-on-surface-variant">
                <span class="material-symbols-rounded text-base text-error/60 shrink-0">remove_circle</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation input */}
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-on-surface-variant px-1">
            Type <span class="font-black text-error">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirm()}
            onInput={(e) => setConfirm(e.currentTarget.value)}
            placeholder="DELETE"
            class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant/40 text-sm font-bold tracking-widest uppercase outline-none focus:border-error/50 transition-colors placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-on-surface-variant/30"
          />
        </div>

        {/* Actions */}
        <div class="flex flex-col gap-2">
          <button
            onClick={handleDelete}
            disabled={!isConfirmed() || loading()}
            class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all
              bg-error text-on-error shadow-md shadow-error/20
              disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed
              enabled:hover:brightness-110"
          >
            <span class="material-symbols-rounded text-lg">
              {loading() ? "progress_activity" : "no_accounts"}
            </span>
            {loading() ? "Deleting…" : "Delete my account"}
          </button>

          <button
            onClick={() => setDrawer(false)}
            disabled={loading()}
            class="w-full py-3.5 rounded-xl font-bold text-sm text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container transition-colors disabled:opacity-30"
          >
            Cancel
          </button>
        </div>

        {/* Legal note */}
        <p class="text-[10px] text-on-surface-variant/40 text-center leading-relaxed px-2">
          Subscription records may be retained for the period required by financial regulations.
          All other personal data is permanently erased within 24 hours.
        </p>

      </div>
    </>
  );
};

export default DeleteAccount;