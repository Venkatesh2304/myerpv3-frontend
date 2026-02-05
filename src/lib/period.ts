
export function formatPeriod(month: number, year: number): string {
    const mm = String(Math.min(12, Math.max(1, Math.trunc(month)))).padStart(2, "0");
    const yyyy = String(Math.trunc(year)).padStart(4, "0");
    return `${mm}${yyyy}`;
}

export function parsePeriod(period: string): { month: number; year: number } {
    const p = (period || "").trim();
    if (!/^\d{6}$/.test(p)) {
        throw new Error("Invalid period format. Expected MMYYYY");
    }
    const month = Number(p.slice(0, 2));
    const year = Number(p.slice(2));
    return { month, year };
}
