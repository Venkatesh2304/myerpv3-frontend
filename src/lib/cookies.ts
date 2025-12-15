export function getCookie(name: string): string | null {
	const v = document.cookie.split("; ").find((row) => row.startsWith(name + "="));
	return v ? decodeURIComponent(v.split("=")[1]) : null;
}

export function setCookie(name: string, value: string, days = 10) {
	const expires = new Date(Date.now() + days * 864e5).toUTCString();
	const secure = window.location.protocol === "https:" ? "; Secure" : "";
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Expires=${expires}; SameSite=None${secure}`;
}

export function deleteCookie(name: string) {
	document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None`;
}
