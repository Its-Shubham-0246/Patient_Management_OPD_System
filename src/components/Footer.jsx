export default function Footer() {
  return (
    <footer className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-1 text-xs text-slate-400 dark:text-slate-600">
      <span>🏥 OPD Management System &mdash; Streamlining Patient Care</span>
      <span>© {new Date().getFullYear()} · All rights reserved</span>
    </footer>
  );
}