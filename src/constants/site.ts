/**
 * 참가자가 접속하는 웹 주소. 관리자 운영 현황의 접속 QR 코드가 이 주소로 만들어집니다.
 *
 * 주소를 바꾸려면 환경변수 VITE_PUBLIC_URL만 바꾸면 됩니다 (예: https://reading.dobong.example).
 * 값이 없으면 지금 접속한 주소(window.location.origin)를 씁니다.
 */
const configuredUrl = import.meta.env.VITE_PUBLIC_URL?.trim();

export const PUBLIC_SITE_URL = `${(configuredUrl || window.location.origin).replace(/\/+$/, "")}/`;
