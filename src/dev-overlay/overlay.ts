import type { TrackedRequest, DevOverlayConfig } from './types'
import type { RequestTracker } from './tracker'

const ICONS = {
  gear: `<svg width="16" height="16" viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path d="M 24 4 C 22.423103 4 20.902664 4.1994284 19.451172 4.5371094 A 1.50015 1.50015 0 0 0 18.300781 5.8359375 L 17.982422 8.7382812 C 17.878304 9.6893592 17.328913 10.530853 16.5 11.009766 C 15.672739 11.487724 14.66862 11.540667 13.792969 11.15625 L 13.791016 11.15625 L 11.125 9.9824219 A 1.50015 1.50015 0 0 0 9.4257812 10.330078 C 7.3532865 12.539588 5.7626807 15.215064 4.859375 18.201172 A 1.50015 1.50015 0 0 0 5.4082031 19.845703 L 7.7734375 21.580078 C 8.5457929 22.147918 9 23.042801 9 24 C 9 24.95771 8.5458041 25.853342 7.7734375 26.419922 L 5.4082031 28.152344 A 1.50015 1.50015 0 0 0 4.859375 29.796875 C 5.7625845 32.782665 7.3519262 35.460112 9.4257812 37.669922 A 1.50015 1.50015 0 0 0 11.125 38.015625 L 13.791016 36.841797 C 14.667094 36.456509 15.672169 36.511947 16.5 36.990234 C 17.328913 37.469147 17.878304 38.310641 17.982422 39.261719 L 18.300781 42.164062 A 1.50015 1.50015 0 0 0 19.449219 43.460938 C 20.901371 43.799844 22.423103 44 24 44 C 25.576897 44 27.097336 43.800572 28.548828 43.462891 A 1.50015 1.50015 0 0 0 29.699219 42.164062 L 30.017578 39.261719 C 30.121696 38.310641 30.671087 37.469147 31.5 36.990234 C 32.327261 36.512276 33.33138 36.45738 34.207031 36.841797 L 36.875 38.015625 A 1.50015 1.50015 0 0 0 38.574219 37.669922 C 40.646713 35.460412 42.237319 32.782983 43.140625 29.796875 A 1.50015 1.50015 0 0 0 42.591797 28.152344 L 40.226562 26.419922 C 39.454197 25.853342 39 24.95771 39 24 C 39 23.04229 39.454197 22.146658 40.226562 21.580078 L 42.591797 19.847656 A 1.50015 1.50015 0 0 0 43.140625 18.203125 C 42.237319 15.217017 40.646713 12.539588 38.574219 10.330078 A 1.50015 1.50015 0 0 0 36.875 9.984375 L 34.207031 11.158203 C 33.33138 11.54262 32.327261 11.487724 31.5 11.009766 C 30.671087 10.530853 30.121696 9.6893592 30.017578 8.7382812 L 29.699219 5.8359375 A 1.50015 1.50015 0 0 0 28.550781 4.5390625 C 27.098629 4.2001555 25.576897 4 24 4 z M 24 7 C 24.974302 7 25.90992 7.1748796 26.847656 7.3398438 L 27.035156 9.0644531 C 27.243038 10.963375 28.346913 12.652335 30 13.607422 C 31.654169 14.563134 33.668094 14.673009 35.416016 13.904297 L 37.001953 13.207031 C 38.219788 14.669402 39.183985 16.321182 39.857422 18.130859 L 38.451172 19.162109 C 36.911538 20.291529 36 22.08971 36 24 C 36 25.91029 36.911538 27.708471 38.451172 28.837891 L 39.857422 29.869141 C 39.183985 31.678818 38.219788 33.330598 37.001953 34.792969 L 35.416016 34.095703 C 33.668094 33.326991 31.654169 33.436866 30 34.392578 C 28.346913 35.347665 27.243038 37.036625 27.035156 38.935547 L 26.847656 40.660156 C 25.910002 40.82466 24.973817 41 24 41 C 23.025698 41 22.09008 40.82512 21.152344 40.660156 L 20.964844 38.935547 C 20.756962 37.036625 19.653087 35.347665 18 34.392578 C 16.345831 33.436866 14.331906 33.326991 12.583984 34.095703 L 10.998047 34.792969 C 9.7799772 33.330806 8.8159425 31.678964 8.1425781 29.869141 L 9.5488281 28.837891 C 11.088462 27.708471 12 25.91029 12 24 C 12 22.08971 11.087719 20.290363 9.5488281 19.160156 L 8.1425781 18.128906 C 8.8163325 16.318532 9.7814501 14.667839 11 13.205078 L 12.583984 13.902344 C 14.331906 14.671056 16.345831 14.563134 18 13.607422 C 19.653087 12.652335 20.756962 10.963375 20.964844 9.0644531 L 21.152344 7.3398438 C 22.089998 7.1753403 23.026183 7 24 7 z M 24 16 C 19.599487 16 16 19.59949 16 24 C 16 28.40051 19.599487 32 24 32 C 28.400513 32 32 28.40051 32 24 C 32 19.59949 28.400513 16 24 16 z M 24 19 C 26.779194 19 29 21.220808 29 24 C 29 26.779192 26.779194 29 24 29 C 21.220806 29 19 26.779192 19 24 C 19 21.220808 21.220806 19 24 19 z"></path>
</svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  chevron: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
  back: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  retry: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>`,
  clear: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  clock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  zap: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
}

const COLORS = {
  bg: '#0b1120',
  bgElevated: '#111827',
  bgSurface: '#172033',
  border: '#24324a',
  borderFocus: '#35507a',
  text: '#e5eefb',
  textMuted: '#b4c4dd',
  textDim: '#7f93b3',
  accent: '#38bdf8',
  accentHover: '#0ea5e9',
  accentSoft: 'rgba(56, 189, 248, 0.18)',
  success: '#34d399',
  successBg: 'rgba(52, 211, 153, 0.16)',
  error: '#fb7185',
  errorBg: 'rgba(251, 113, 133, 0.16)',
  warning: '#fbbf24',
  warningBg: 'rgba(251, 191, 36, 0.16)',
  info: '#a78bfa',
  infoBg: 'rgba(167, 139, 250, 0.16)',
  get: '#34d399',
  post: '#38bdf8',
  put: '#fbbf24',
  patch: '#a78bfa',
  delete: '#fb7185',
}

const STYLES = `
  #nexa-dev-overlay * { margin: 0; padding: 0; box-sizing: border-box; }
  #nexa-dev-overlay {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${COLORS.bg};
    color: ${COLORS.text};
    border: 1px solid ${COLORS.border};
    border-radius: 16px;
    box-shadow: 0 28px 60px -24px rgba(2, 6, 23, 0.78), 0 0 0 1px rgba(148, 163, 184, 0.08);
    overflow: hidden;
  }
  #nexa-dev-overlay .nexa-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid ${COLORS.border};
    background: ${COLORS.bgElevated};
  }
  #nexa-dev-overlay .nexa-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  #nexa-dev-overlay .nexa-logo {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, ${COLORS.accentSoft}, rgba(255,255,255,0.02));
    border-radius: 8px;
    overflow: hidden;
  }
  #nexa-dev-overlay .nexa-title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  #nexa-dev-overlay .nexa-header-actions {
    display: flex;
    gap: 4px;
  }
  #nexa-dev-overlay .nexa-icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: ${COLORS.textMuted};
    cursor: pointer;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-icon-btn:hover {
    background: ${COLORS.bgSurface};
    color: ${COLORS.text};
  }
  #nexa-dev-overlay .nexa-metrics-bar {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    background: ${COLORS.bg};
    border-bottom: 1px solid ${COLORS.border};
  }
  #nexa-dev-overlay .nexa-metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 12px;
    background: ${COLORS.bgSurface};
    border-radius: 10px;
    transition: all 0.2s;
  }
  #nexa-dev-overlay .nexa-metric:hover {
    background: rgba(53, 80, 122, 0.3);
  }
  #nexa-dev-overlay .nexa-metric-value {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: ${COLORS.text};
  }
  #nexa-dev-overlay .nexa-metric-ok .nexa-metric-value { color: ${COLORS.success}; }
  #nexa-dev-overlay .nexa-metric-err .nexa-metric-value { color: ${COLORS.error}; }
  #nexa-dev-overlay .nexa-metric-label {
    font-size: 11px;
    color: ${COLORS.textDim};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  #nexa-dev-overlay .nexa-search {
    padding: 12px 16px;
    border-bottom: 1px solid ${COLORS.border};
    position: relative;
  }
  #nexa-dev-overlay .nexa-search-icon {
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    color: ${COLORS.textDim};
  }
  #nexa-dev-overlay .nexa-search-input {
    width: 100%;
    padding: 10px 12px 10px 38px;
    background: ${COLORS.bg};
    border: 1px solid ${COLORS.border};
    border-radius: 10px;
    color: ${COLORS.text};
    font-size: 13px;
    outline: none;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-search-input:focus {
    border-color: ${COLORS.accent};
    box-shadow: 0 0 0 3px ${COLORS.accentSoft};
  }
  #nexa-dev-overlay .nexa-search-input::placeholder { color: ${COLORS.textDim}; }
  #nexa-dev-overlay .nexa-filters {
    display: flex;
    gap: 6px;
    padding: 12px 16px 12px 16px;
    border-bottom: 1px solid ${COLORS.border};
    overflow-x: auto;
    scrollbar-width: none;
    min-height: 50px;
  }
  #nexa-dev-overlay .nexa-filters::-webkit-scrollbar { display: none; }
  #nexa-dev-overlay .nexa-filter-chip {
    padding: 4px 10px;
    background: ${COLORS.bgSurface};
    border: 1px solid ${COLORS.border};
    border-radius: 20px;
    color: ${COLORS.textDim};
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-filter-chip:hover { border-color: ${COLORS.borderFocus}; color: ${COLORS.textMuted}; }
  #nexa-dev-overlay .nexa-filter-chip-active {
    background: ${COLORS.accentSoft};
    border-color: ${COLORS.accent};
    color: ${COLORS.accent};
  }
  #nexa-dev-overlay .nexa-tabs {
    display: flex;
    gap: 4px;
    padding: 8px 16px;
    border-bottom: 1px solid ${COLORS.border};
  }
  #nexa-dev-overlay .nexa-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: ${COLORS.textMuted};
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-tab:hover { color: ${COLORS.text}; background: ${COLORS.bgElevated}; }
  #nexa-dev-overlay .nexa-tab-active { color: ${COLORS.text}; background: ${COLORS.accent} !important; }
  #nexa-dev-overlay .nexa-tab-count {
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(148, 163, 184, 0.14);
    border-radius: 10px;
  }
  #nexa-dev-overlay .nexa-body { flex: 1; overflow: hidden; display: flex; }
  #nexa-dev-overlay .nexa-panel { display: none; width: 100%; overflow-y: auto; }
  #nexa-dev-overlay .nexa-panel-active { display: block; }
  #nexa-dev-overlay .nexa-request-list {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  #nexa-dev-overlay .nexa-request-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: ${COLORS.bgSurface};
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s;
    animation: nexaFadeIn 0.2s ease forwards;
    opacity: 0;
  }
  @keyframes nexaFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  #nexa-dev-overlay .nexa-request-item:hover {
    background: rgba(23, 32, 51, 0.92);
    border-color: ${COLORS.borderFocus};
    transform: translateX(2px);
  }
  #nexa-dev-overlay .nexa-req-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  #nexa-dev-overlay .nexa-method {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  #nexa-dev-overlay .nexa-method-get { background: ${COLORS.successBg}; color: ${COLORS.get}; }
  #nexa-dev-overlay .nexa-method-post { background: ${COLORS.accentSoft}; color: ${COLORS.post}; }
  #nexa-dev-overlay .nexa-method-put { background: ${COLORS.warningBg}; color: ${COLORS.put}; }
  #nexa-dev-overlay .nexa-method-patch { background: ${COLORS.infoBg}; color: ${COLORS.patch}; }
  #nexa-dev-overlay .nexa-method-delete { background: ${COLORS.errorBg}; color: ${COLORS.delete}; }
  #nexa-dev-overlay .nexa-status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    min-width: 36px;
    text-align: center;
  }
  #nexa-dev-overlay .nexa-ok { background: ${COLORS.successBg}; color: ${COLORS.success}; }
  #nexa-dev-overlay .nexa-err { background: ${COLORS.errorBg}; color: ${COLORS.error}; }
  #nexa-dev-overlay .nexa-url {
    font-size: 13px;
    color: ${COLORS.textMuted};
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  #nexa-dev-overlay .nexa-req-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  #nexa-dev-overlay .nexa-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 6px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  #nexa-dev-overlay .nexa-badge-cache { background: ${COLORS.infoBg}; color: ${COLORS.info}; }
  #nexa-dev-overlay .nexa-badge-retry { background: ${COLORS.warningBg}; color: ${COLORS.warning}; }
  #nexa-dev-overlay .nexa-duration {
    font-size: 12px;
    font-weight: 600;
    color: ${COLORS.textDim};
    font-variant-numeric: tabular-nums;
  }
  #nexa-dev-overlay .nexa-slow { color: ${COLORS.warning}; }
  #nexa-dev-overlay .nexa-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    color: ${COLORS.textDim};
  }
  #nexa-dev-overlay .nexa-empty svg { margin-bottom: 16px; opacity: 0.4; }
  #nexa-dev-overlay .nexa-empty p { font-size: 14px; color: ${COLORS.textMuted}; margin-bottom: 4px; }
  #nexa-dev-overlay .nexa-empty span { font-size: 12px; color: ${COLORS.textDim}; }
  #nexa-dev-overlay .nexa-detail {
    flex-direction: column;
    padding: 16px;
    display: none;
    overflow-y: auto;
    max-height: 100%;
  }
  #nexa-dev-overlay .nexa-detail-active { display: flex; }
  #nexa-dev-overlay .nexa-detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  #nexa-dev-overlay .nexa-btn-group {
    display: flex;
    gap: 8px;
  }
  #nexa-dev-overlay .nexa-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: ${COLORS.bgSurface};
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    color: ${COLORS.textMuted};
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  #nexa-dev-overlay .nexa-btn:hover { background: rgba(53, 80, 122, 0.24); color: ${COLORS.text}; }
  #nexa-dev-overlay .nexa-btn-retry { background: ${COLORS.successBg}; border-color: transparent; color: ${COLORS.success}; }
  #nexa-dev-overlay .nexa-btn-retry:hover { background: ${COLORS.success}; color: #052e26; }
  #nexa-dev-overlay .nexa-btn-copy { background: ${COLORS.accentSoft}; border-color: transparent; color: ${COLORS.accent}; }
  #nexa-dev-overlay .nexa-btn-copy:hover { background: ${COLORS.accent}; color: #ffffff; }
  #nexa-dev-overlay .nexa-card {
    background: ${COLORS.bgSurface};
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
  }
  #nexa-dev-overlay .nexa-card h3 {
    font-size: 12px;
    font-weight: 600;
    color: ${COLORS.textDim};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  #nexa-dev-overlay .nexa-notification {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: ${COLORS.bgElevated};
    color: ${COLORS.text};
    padding: 10px 18px;
    border-radius: 12px;
    border: 1px solid ${COLORS.borderFocus};
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
    z-index: 2147483651;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  #nexa-dev-overlay .nexa-notification-show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  #nexa-dev-overlay .nexa-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px solid ${COLORS.border};
  }
  #nexa-dev-overlay .nexa-row:last-child { border-bottom: none; }
  #nexa-dev-overlay .nexa-row span { color: ${COLORS.textMuted}; }
  #nexa-dev-overlay .nexa-row strong { color: ${COLORS.text}; font-weight: 500; font-variant-numeric: tabular-nums; }
  #nexa-dev-overlay .nexa-row .nexa-ok { color: ${COLORS.success}; }
  #nexa-dev-overlay .nexa-row .nexa-err { color: ${COLORS.error}; }
  #nexa-dev-overlay .nexa-code {
    background: ${COLORS.bg};
    border-radius: 8px;
    padding: 12px;
    font-size: 11px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: ${COLORS.textMuted};
    overflow-x: auto;
    white-space: pre;
    max-height: 200px;
    line-height: 1.6;
  }
  #nexa-dev-overlay .nexa-url-full {
    font-size: 12px;
    word-break: break-all;
    color: ${COLORS.accent};
  }
  #nexa-dev-overlay .nexa-metrics-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  #nexa-dev-overlay .nexa-settings-panel {
    position: absolute;
    top: 72px;
    left: 16px;
    right: 16px;
    bottom: 16px;
    z-index: 2147483650;
    display: none;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    background: ${COLORS.bgElevated};
    border: 1px solid ${COLORS.border};
    box-shadow: 0 28px 60px -24px rgba(2, 6, 23, 0.76);
    overflow: auto;
  }
  #nexa-dev-overlay .nexa-settings-row { display:flex;align-items:center;gap:8px;margin-bottom:8px }
  #nexa-dev-overlay .nexa-settings-row label{font-size:13px;color:${COLORS.textDim};min-width:70px}
  #nexa-dev-overlay .nexa-settings-row select{padding:6px 8px;border-radius:8px;border:1px solid ${COLORS.border};background:${COLORS.bg};color:${COLORS.text}}

  #nexa-dev-overlay.nexa-theme-light {
    background: #f8fbff;
    color: #0f172a;
    border-color: #d8e4f2;
    box-shadow: 0 28px 60px -24px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(148, 163, 184, 0.16);
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-header,
  #nexa-dev-overlay.nexa-theme-light .nexa-metrics-bar,
  #nexa-dev-overlay.nexa-theme-light .nexa-search,
  #nexa-dev-overlay.nexa-theme-light .nexa-tabs {
    background: #f8fbff;
    border-color: #d8e4f2;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-logo,
  #nexa-dev-overlay.nexa-theme-light .nexa-metric,
  #nexa-dev-overlay.nexa-theme-light .nexa-request-item,
  #nexa-dev-overlay.nexa-theme-light .nexa-btn,
  #nexa-dev-overlay.nexa-theme-light .nexa-card,
  #nexa-dev-overlay.nexa-theme-light .nexa-settings-panel,
  #nexa-dev-overlay.nexa-theme-light .nexa-notification {
    background: #ffffff;
    border-color: #d8e4f2;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-metric:hover,
  #nexa-dev-overlay.nexa-theme-light .nexa-icon-btn:hover,
  #nexa-dev-overlay.nexa-theme-light .nexa-btn:hover,
  #nexa-dev-overlay.nexa-theme-light .nexa-tab:hover,
  #nexa-dev-overlay.nexa-theme-light .nexa-request-item:hover {
    background: #eef6ff;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-request-item:hover {
    border-color: #93c5fd;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-search-icon,
  #nexa-dev-overlay.nexa-theme-light .nexa-metric-label,
  #nexa-dev-overlay.nexa-theme-light .nexa-duration,
  #nexa-dev-overlay.nexa-theme-light .nexa-empty,
  #nexa-dev-overlay.nexa-theme-light .nexa-empty span,
  #nexa-dev-overlay.nexa-theme-light .nexa-row span,
  #nexa-dev-overlay.nexa-theme-light .nexa-settings-row label,
  #nexa-dev-overlay.nexa-theme-light .nexa-notification {
    color: #64748b;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-notification {
    box-shadow: 0 12px 32px rgba(15,23,42,0.12);
    border-color: #e2e8f0;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-url,
  #nexa-dev-overlay.nexa-theme-light .nexa-empty p,
  #nexa-dev-overlay.nexa-theme-light .nexa-icon-btn,
  #nexa-dev-overlay.nexa-theme-light .nexa-tab,
  #nexa-dev-overlay.nexa-theme-light .nexa-btn,
  #nexa-dev-overlay.nexa-theme-light .nexa-code {
    color: #334155;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-metric-value,
  #nexa-dev-overlay.nexa-theme-light .nexa-title,
  #nexa-dev-overlay.nexa-theme-light .nexa-row strong {
    color: #0f172a;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-search-input,
  #nexa-dev-overlay.nexa-theme-light .nexa-settings-row select,
  #nexa-dev-overlay.nexa-theme-light .nexa-code {
    background: #ffffff;
    color: #0f172a;
    border-color: #d8e4f2;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-search-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-tab-active {
    color: #ffffff;
    background: #0ea5e9 !important;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-tab-count {
    background: rgba(14, 165, 233, 0.12);
    color: #075985;
  }
  #nexa-dev-overlay.nexa-theme-light .nexa-code,
  #nexa-dev-overlay.nexa-theme-light .nexa-detail,
  #nexa-dev-overlay.nexa-theme-light .nexa-row {
    border-color: #d8e4f2;
  }
  #nexa-dev-overlay .nexa-slow-req {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  #nexa-dev-overlay.nexa-view-detail .nexa-metrics-bar,
  #nexa-dev-overlay.nexa-view-detail .nexa-search,
  #nexa-dev-overlay.nexa-view-detail .nexa-filters,
  #nexa-dev-overlay.nexa-view-detail .nexa-tabs,
  #nexa-dev-overlay.nexa-view-detail .nexa-body {
    display: none !important;
  }
`

function isDevelopmentEnv(): boolean {
  try {
    if (typeof process !== 'undefined') {
      const proc = process as unknown as { env?: { NODE_ENV?: string } }
      if (proc.env && typeof proc.env.NODE_ENV === 'string') {
        return proc.env.NODE_ENV === 'development'
      }
    }
  } catch {
    // ignore
  }
  try {
    if (typeof location !== 'undefined' && location.hostname) {
      const host = location.hostname
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
        return true
      }
    }
  } catch {
    // ignore
  }
  return false
}

export class DevOverlayUI {
  private panel: HTMLElement | null = null
  private floatingIcon: HTMLElement | null = null
  private tracker: RequestTracker
  private visible = false
  private selectedRequest: TrackedRequest | null = null
  private config: Required<DevOverlayConfig>
  private searchQuery = ''
  private filterType: 'all' | 'xhr' | 'fetch' | 'err' | 'slow' = 'all'
  private removeTrackerListener: (() => void) | null = null
  private keyboardShortcutHandler: ((e: KeyboardEvent) => void) | null = null
  private globalKeyboardHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(tracker: RequestTracker) {
    this.tracker = tracker
    this.config = tracker.getConfig()
    if (!this.canUseDOM()) {
      return
    }
    this.setupKeyboardShortcut()
    this.createPanel()
  }

  show(): void {
    if (!this.panel) {
      return
    }
    this.panel.style.display = 'flex'
    this.panel.style.opacity = '0'
    this.panel.style.transform = 'scale(0.96) translateY(8px)'
    const animate =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (callback: FrameRequestCallback) => setTimeout(callback, 0)
    animate(() => {
      this.panel!.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      this.panel!.style.opacity = '1'
      this.panel!.style.transform = 'scale(1) translateY(0)'
    })
    this.visible = true
    // hide floating icon when panel is visible
    this.hideFloatingIcon()
  }

  hide(): void {
    if (!this.panel) {
      return
    }
    this.panel.style.transition = 'all 0.15s ease-out'
    this.panel.style.opacity = '0'
    this.panel.style.transform = 'scale(0.96) translateY(8px)'
    setTimeout(() => {
      if (this.panel) {
        this.panel.style.display = 'none'
      }
    }, 150)
    this.visible = false
    // show floating icon when panel is hidden (if enabled and dev-only policy allows)
    if (this.config.enabled && (!this.config.devOnly || isDevelopmentEnv())) {
      this.showFloatingIcon()
    }
  }

  toggle(): void {
    this.visible ? this.hide() : this.show()
  }

  destroy(): void {
    if (this.keyboardShortcutHandler) {
      document.removeEventListener('keydown', this.keyboardShortcutHandler)
      this.keyboardShortcutHandler = null
    }
    if (this.globalKeyboardHandler) {
      document.removeEventListener('keydown', this.globalKeyboardHandler)
      this.globalKeyboardHandler = null
    }
    this.removeTrackerListener?.()
    this.removeTrackerListener = null
    this.panel?.remove()
    this.panel = null
    this.visible = false
    this.selectedRequest = null
    if (this.floatingIcon) {
      this.floatingIcon.remove()
      this.floatingIcon = null
    }
  }

  private setupKeyboardShortcut(): void {
    const keys = this.config.keyboardShortcut.split('+')
    const requiredKeys = new Set(keys.map((k) => k.toLowerCase()))
    this.keyboardShortcutHandler = (e: KeyboardEvent) => {
      const pressed = new Set<string>()
      if (e.ctrlKey) {
        pressed.add('ctrl')
      }
      if (e.metaKey) {
        pressed.add('meta')
        pressed.add('cmd')
        pressed.add('ctrl')
      }
      if (e.shiftKey) {
        pressed.add('shift')
      }
      if (e.altKey) {
        pressed.add('alt')
      }
      if (e.key && e.key.length === 1) {
        pressed.add(e.key.toLowerCase())
      } else if (e.key.length > 1) {
        pressed.add(e.key.toLowerCase())
      }
      let match = true
      for (const k of requiredKeys) {
        if (!pressed.has(k)) {
          match = false
          break
        }
      }
      if (match && pressed.size === requiredKeys.size) {
        e.preventDefault()
        this.toggle()
      }
    }
    document.addEventListener('keydown', this.keyboardShortcutHandler)
  }

  private createPanel(): void {
    if (!this.canUseDOM()) {
      return
    }
    // Prevent duplicate overlays from being mounted (HMR, multiple inits)
    try {
      const existing = document.getElementById('nexa-dev-overlay')
      if (existing) {
        existing.remove()
      }
    } catch {
      // ignore
    }
    this.panel = document.createElement('div')
    this.panel.id = 'nexa-dev-overlay'

    const pos = this.config.position
    const isBottom = pos.includes('bottom')
    const isRight = pos.includes('right')
    const offsetPx = `${this.config.floatingButtonOffset ?? 24}px`

    const branding = this.config.branding || 'Nexa DevTools'
    const icon =
      this.config.icon ||
      'https://raw.githubusercontent.com/Berea-Soft/nexa/refs/heads/main/src/assets/faviconNew.png'

    this.panel.style.cssText = `
      position: fixed;
      ${isBottom ? `bottom: ${offsetPx};` : `top: ${offsetPx};`}
      ${isRight ? `right: ${offsetPx};` : `left: ${offsetPx};`}
      width: 420px;
      max-height: 70vh;
      z-index: 2147483649;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `
    this.panel.innerHTML = `<style>${STYLES}</style>

      <div class="nexa-header">
        <div class="nexa-header-left">
          <div class="nexa-logo">
            <img src="${icon}" alt="${branding}" style="width:100%;height:auto;object-fit:cover;border-radius:8px;display:block;" />
          </div>
          <span class="nexa-title">${branding}</span>
        </div>
        <div class="nexa-header-actions">
          <button class="nexa-icon-btn nexa-btn-export" title="Export history (JSON)">${ICONS.download}</button>
          <button class="nexa-icon-btn nexa-btn-settings" title="Settings">${ICONS.gear}</button>
          <button class="nexa-icon-btn nexa-btn-clear" title="Clear history">${ICONS.clear}</button>
          <button class="nexa-icon-btn nexa-btn-close" title="Close (Esc)">${ICONS.close}</button>
        </div>
      </div>

      <div class="nexa-notification"></div>

      <div class="nexa-settings-panel" style="display:none">
        <div class="nexa-settings-row">
          <label for="nexa-pos">Position</label>
          <select id="nexa-pos" data-setting="position">
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>
        <div class="nexa-settings-row">
          <label for="nexa-theme">Theme</label>
          <select id="nexa-theme" data-setting="theme">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="nexa-btn nexa-btn-save">Save</button>
          <button class="nexa-btn nexa-btn-cancel">Cancel</button>
        </div>
      </div>

      <div class="nexa-metrics-bar">
        <div class="nexa-metric"><span class="nexa-metric-value" data-metric="total">0</span><span class="nexa-metric-label">Requests</span></div>
        <div class="nexa-metric"><span class="nexa-metric-value" data-metric="avg">0ms</span><span class="nexa-metric-label">Avg</span></div>
        <div class="nexa-metric"><span class="nexa-metric-value" data-metric="rate">0/s</span><span class="nexa-metric-label">Throughput</span></div>
        <div class="nexa-metric nexa-metric-ok"><span class="nexa-metric-value" data-metric="success">0</span><span class="nexa-metric-label">Success</span></div>
        <div class="nexa-metric nexa-metric-err"><span class="nexa-metric-value" data-metric="fail">0</span><span class="nexa-metric-label">Failed</span></div>
      </div>

      <div class="nexa-search">
        <span class="nexa-search-icon">${ICONS.search}</span>
        <input type="text" class="nexa-search-input" placeholder="Filter by URL, method, or status..." />
      </div>

      <div class="nexa-filters">
        <div class="nexa-filter-chip nexa-filter-chip-active" data-filter="all">All</div>
        <div class="nexa-filter-chip" data-filter="err">Errors</div>
        <div class="nexa-filter-chip" data-filter="xhr">JSON</div>
        <div class="nexa-filter-chip" data-filter="slow">Slow</div>
      </div>

      <div class="nexa-tabs">
        <button class="nexa-tab nexa-tab-active" data-tab="requests"><span>Requests</span><span class="nexa-tab-count" data-count="requests">0</span></button>
        <button class="nexa-tab" data-tab="metrics"><span>Metrics</span></button>
      </div>

      <div class="nexa-body">
        <div class="nexa-panel nexa-panel-active" data-panel="requests"><div class="nexa-request-list"></div></div>
        <div class="nexa-panel" data-panel="metrics"><div class="nexa-metrics-content"></div></div>
      </div>

      <div class="nexa-detail" style="display:none">
        <div class="nexa-detail-header">
          <button class="nexa-btn nexa-btn-back">${ICONS.back} Back</button>
          <div class="nexa-btn-group">
            <button class="nexa-btn nexa-btn-copy">${ICONS.copy} Copy as fetch</button>
            <button class="nexa-btn nexa-btn-retry">${ICONS.retry} Retry</button>
          </div>
        </div>
        <div class="nexa-detail-body"></div>
      </div>
    `

    document.body.appendChild(this.panel)
    // Apply theme class immediately so initial render reflects persisted theme
    if (this.config.theme === 'light') {
      this.panel.classList.add('nexa-theme-light')
    } else {
      this.panel.classList.remove('nexa-theme-light')
    }
    this.bindEvents()
    this.removeTrackerListener = this.tracker.onChange(() => this.render())
    const canShowFloating = !this.config.devOnly || isDevelopmentEnv()
    if (this.config.enabled && canShowFloating) {
      this.createFloatingIcon()
    }
    this.hide()

    this.globalKeyboardHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.visible) {
        this.hide()
        return
      }
      if (
        this.visible &&
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'f'
      ) {
        e.preventDefault()
        const searchInput = this.panel?.querySelector(
          '.nexa-search-input',
        ) as HTMLInputElement | null
        searchInput?.focus()
        searchInput?.select()
      }
    }
    document.addEventListener('keydown', this.globalKeyboardHandler)
  }

  private bindEvents(): void {
    if (!this.panel) {
      return
    }
    this.panel
      .querySelector('.nexa-btn-close')
      ?.addEventListener('click', () => this.hide())
    this.panel
      .querySelector('.nexa-btn-export')
      ?.addEventListener('click', () => this.exportHistory())
    this.panel
      .querySelector('.nexa-btn-copy')
      ?.addEventListener('click', () => this.copyAsFetch())
    this.panel
      .querySelector('.nexa-btn-clear')
      ?.addEventListener('click', () => {
        this.tracker.clear()
        this.render()
      })
    this.panel
      .querySelector('.nexa-btn-back')
      ?.addEventListener('click', () => this.showMainView())
    this.panel
      .querySelector('.nexa-btn-retry')
      ?.addEventListener('click', () => this.retrySelected())

    const searchInput = this.panel.querySelector(
      '.nexa-search-input',
    ) as HTMLInputElement
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase()
      this.renderRequestList()
    })

    this.panel.querySelectorAll('.nexa-filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.panel!.querySelectorAll('.nexa-filter-chip').forEach((c) =>
          c.classList.remove('nexa-filter-chip-active'),
        )
        ;(chip as HTMLElement).classList.add('nexa-filter-chip-active')
        this.filterType = (chip as HTMLElement).dataset.filter as
          | 'all'
          | 'xhr'
          | 'fetch'
          | 'err'
          | 'slow'
        this.renderRequestList()
      })
    })

    this.panel.querySelectorAll('.nexa-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.panel!.querySelectorAll('.nexa-tab').forEach((t) =>
          t.classList.remove('nexa-tab-active'),
        )
        this.panel!.querySelectorAll('.nexa-panel').forEach((p) =>
          p.classList.remove('nexa-panel-active'),
        )
        ;(tab as HTMLElement).classList.add('nexa-tab-active')
        const panel = this.panel!.querySelector(
          `[data-panel="${(tab as HTMLElement).dataset.tab}"]`,
        )
        panel?.classList.add('nexa-panel-active')
        if ((tab as HTMLElement).dataset.tab === 'metrics') {
          this.renderMetrics()
        }
      })
    })

    // Settings button
    this.panel
      .querySelector('.nexa-btn-settings')
      ?.addEventListener('click', () => {
        const sp = this.panel!.querySelector(
          '.nexa-settings-panel',
        ) as HTMLElement | null
        if (!sp) {
          return
        }
        // toggle as modal (use flex so layout inside works)
        const posSel = this.panel!.querySelector(
          '[data-setting="position"]',
        ) as HTMLSelectElement | null
        const themeSel = this.panel!.querySelector(
          '[data-setting="theme"]',
        ) as HTMLSelectElement | null
        const isOpen = sp.style.display === 'flex'
        sp.style.display = isOpen ? 'none' : 'flex'
        if (!isOpen) {
          // opening: hide the floating button so modal is not obstructed
          this.hideFloatingIcon()
          if (posSel) {
            posSel.value = this.config.position
          }
          if (themeSel) {
            themeSel.value = this.config.theme
          }
          posSel?.focus()
        }
      })

    this.panel
      .querySelector('.nexa-btn-save')
      ?.addEventListener('click', () => {
        const posSel = this.panel!.querySelector(
          '[data-setting="position"]',
        ) as HTMLSelectElement | null
        const themeSel = this.panel!.querySelector(
          '[data-setting="theme"]',
        ) as HTMLSelectElement | null
        const newPos = posSel?.value as DevOverlayConfig['position'] | undefined
        const newTheme = themeSel?.value as
          | DevOverlayConfig['theme']
          | undefined
        const partial: Partial<DevOverlayConfig> = {}
        if (newPos !== undefined) {
          partial.position = newPos
        }
        if (newTheme !== undefined) {
          partial.theme = newTheme
        }
        const newConfig = this.tracker.updateConfig(partial)
        this.applyConfigToUI(newConfig)
        const sp = this.panel!.querySelector(
          '.nexa-settings-panel',
        ) as HTMLElement | null
        if (sp) {
          sp.style.display = 'none'
        }
      })

    this.panel
      .querySelector('.nexa-btn-cancel')
      ?.addEventListener('click', () => {
        const sp = this.panel!.querySelector(
          '.nexa-settings-panel',
        ) as HTMLElement | null
        if (sp) {
          sp.style.display = 'none'
        }
      })
  }

  private render(): void {
    if (!this.panel || !this.visible) {
      return
    }
    this.renderMetricsBar()
    this.renderRequestList()
  }

  private renderMetricsBar(): void {
    const m = this.tracker.getMetrics()
    const el = this.panel
    if (!el) {
      return
    }
    el.querySelector('[data-metric="total"]')!.textContent = String(
      m.totalRequests,
    )
    el.querySelector('[data-metric="avg"]')!.textContent =
      `${m.avgDuration.toFixed(0)}ms`
    el.querySelector('[data-metric="rate"]')!.textContent =
      `${m.requestsPerSecond.toFixed(1)}`
    el.querySelector('[data-metric="success"]')!.textContent = String(
      m.successfulRequests,
    )
    el.querySelector('[data-metric="fail"]')!.textContent = String(
      m.failedRequests,
    )
    el.querySelector('[data-count="requests"]')!.textContent = String(
      m.totalRequests,
    )
  }

  private renderRequestList(): void {
    const list = this.panel?.querySelector('.nexa-request-list')
    if (!list) {
      return
    }

    let requests = this.tracker.getHistory()

    if (this.filterType === 'err') {
      requests = requests.filter((r) => !r.ok)
    } else if (this.filterType === 'xhr') {
      // JSON requests
      requests = requests.filter(
        (r) =>
          (r.headers['content-type'] &&
            r.headers['content-type'].includes('json')) ||
          (r.responseHeaders &&
            r.responseHeaders['content-type'] &&
            r.responseHeaders['content-type'].includes('json')),
      )
    } else if (this.filterType === 'slow') {
      requests = requests.filter((r) => r.duration > 500)
    }

    if (this.searchQuery) {
      requests = requests.filter(
        (r) =>
          r.url.toLowerCase().includes(this.searchQuery) ||
          r.method.toLowerCase().includes(this.searchQuery) ||
          String(r.status).includes(this.searchQuery),
      )
    }

    if (requests.length === 0) {
      list.innerHTML = `
        <div class="nexa-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
          </svg>
          <p>${this.searchQuery ? 'No matching requests' : 'No requests yet'}</p>
          <span>${this.searchQuery ? 'Try a different search term' : 'Make a request to see it here'}</span>
        </div>`
      return
    }

    list.innerHTML = requests
      .map(
        (r, i) => `
      <div class="nexa-request-item" data-id="${r.id}" style="animation-delay: ${Math.min(i * 20, 300)}ms">
        <div class="nexa-req-left">
          <span class="nexa-method nexa-method-${r.method.toLowerCase()}">${r.method}</span>
          <span class="nexa-status ${r.ok ? 'nexa-ok' : 'nexa-err'}">${r.status || 'ERR'}</span>
          <span class="nexa-url" title="${r.url}">${this.truncateUrl(r.url)}</span>
        </div>
        <div class="nexa-req-right">
          ${r.cached ? '<span class="nexa-badge nexa-badge-cache">Cache</span>' : ''}
          ${r.retryCount > 0 ? `<span class="nexa-badge nexa-badge-retry">${r.retryCount}R</span>` : ''}
          <span class="nexa-duration ${r.duration > 500 ? 'nexa-slow' : ''}">${r.duration.toFixed(0)}ms</span>
          ${ICONS.chevron}
        </div>
      </div>
    `,
      )
      .join('')

    list.querySelectorAll('.nexa-request-item').forEach((item) => {
      item.addEventListener('click', () => {
        const id = (item as HTMLElement).dataset.id
        const request = requests.find((r) => r.id === id)
        if (request) {
          this.showDetail(request)
        }
      })
    })
  }

  private renderMetrics(): void {
    const m = this.tracker.getMetrics()
    const el = this.panel?.querySelector('.nexa-metrics-content')
    if (!el) {
      return
    }

    const successRate =
      m.totalRequests > 0
        ? ((m.successfulRequests / m.totalRequests) * 100).toFixed(1)
        : '0'

    el.innerHTML = `
      <div class="nexa-card">
        <h3>Overview</h3>
        <div class="nexa-row"><span>Total Requests</span><strong>${m.totalRequests}</strong></div>
        <div class="nexa-row"><span>Successful</span><strong class="nexa-ok">${m.successfulRequests}</strong></div>
        <div class="nexa-row"><span>Failed</span><strong class="nexa-err">${m.failedRequests}</strong></div>
        <div class="nexa-row"><span>Cached</span><strong>${m.cachedRequests}</strong></div>
        <div class="nexa-row"><span>Success Rate</span><strong>${successRate}%</strong></div>
      </div>
      <div class="nexa-card">
        <h3>Performance</h3>
        <div class="nexa-row"><span>Average</span><strong>${m.avgDuration.toFixed(1)}ms</strong></div>
        <div class="nexa-row"><span>Fastest</span><strong class="nexa-ok">${m.minDuration.toFixed(1)}ms</strong></div>
        <div class="nexa-row"><span>Slowest</span><strong class="nexa-err">${m.maxDuration.toFixed(1)}ms</strong></div>
        <div class="nexa-row"><span>Throughput</span><strong>${m.requestsPerSecond.toFixed(2)} req/s</strong></div>
      </div>
      ${
        m.slowestRequests.length > 0
          ? `
        <div class="nexa-card">
          <h3>Slowest Requests</h3>
          ${m.slowestRequests
            .map(
              (r) => `
            <div class="nexa-row nexa-slow-req">
              <span><span class="nexa-method nexa-method-${r.method.toLowerCase()}" style="font-size:10px;padding:2px 5px;">${r.method}</span> ${this.truncateUrl(r.url, 25)}</span>
              <strong class="nexa-err">${r.duration.toFixed(0)}ms</strong>
            </div>
          `,
            )
            .join('')}
        </div>
      `
          : ''
      }`
  }

  private showDetail(request: TrackedRequest): void {
    this.selectedRequest = request
    if (!this.panel) {
      return
    }
    const body = this.panel.querySelector('.nexa-body') as HTMLElement | null
    const detail = this.panel.querySelector(
      '.nexa-detail',
    ) as HTMLElement | null
    const content = this.panel.querySelector('.nexa-detail-body')
    if (!body || !detail || !content) {
      return
    }

    this.panel.classList.add('nexa-view-detail')
    body.style.display = 'none'
    detail.style.display = 'flex'

    content.innerHTML = `
      <div class="nexa-card">
        <h3>Request</h3>
        <div class="nexa-row"><span>Method</span><strong style="color:${request.method === 'GET' ? COLORS.get : request.method === 'POST' ? COLORS.post : request.method === 'DELETE' ? COLORS.delete : COLORS.warning}">${request.method}</strong></div>
        <div class="nexa-row"><span>URL</span><span class="nexa-url-full">${request.url}</span></div>
        <div class="nexa-row"><span>Status</span><strong class="${request.ok ? 'nexa-ok' : 'nexa-err'}">${request.status || 'N/A'}</strong></div>
        <div class="nexa-row"><span>Duration</span><strong>${request.duration.toFixed(1)}ms</strong></div>
        <div class="nexa-row"><span>Cached</span><strong>${request.cached ? 'Yes' : 'No'}</strong></div>
        <div class="nexa-row"><span>Retries</span><strong>${request.retryCount}</strong></div>
        <div class="nexa-row"><span>Timestamp</span><strong>${new Date(request.timestamp).toLocaleTimeString()}</strong></div>
      </div>
      ${
        request.body !== undefined
          ? `
        <div class="nexa-card">
          <h3>Request Body</h3>
          <pre class="nexa-code">${this.formatJson(request.body)}</pre>
        </div>
      `
          : ''
      }
      ${
        Object.keys(request.headers).length > 0
          ? `
        <div class="nexa-card">
          <h3>Headers</h3>
          <pre class="nexa-code">${this.formatJson(request.headers)}</pre>
        </div>
      `
          : ''
      }`
  }

  private showMainView(): void {
    if (this.panel) {
      this.panel.classList.remove('nexa-view-detail')
    }
    const body = this.panel?.querySelector('.nexa-body') as HTMLElement | null
    const detail = this.panel?.querySelector(
      '.nexa-detail',
    ) as HTMLElement | null
    if (body) {
      body.style.display = 'flex'
    }
    if (detail) {
      detail.style.display = 'none'
    }
    this.selectedRequest = null
  }

  private retrySelected(): void {
    if (!this.selectedRequest) {
      return
    }
    const { method, url, body, headers } = this.selectedRequest
    fetch(url, {
      method,
      headers: headers as Record<string, string>,
      body: body ? JSON.stringify(body) : undefined,
    })
      .then(async (res) => {
        if (this.selectedRequest) {
          this.selectedRequest = {
            ...this.selectedRequest,
            status: res.status,
            ok: res.ok,
            duration: this.selectedRequest.duration,
            timestamp: Date.now(),
          }
          this.showDetail(this.selectedRequest)
        }
      })
      .catch(() => {})
  }

  private exportHistory(): void {
    const history = this.tracker.getHistory()
    const data = JSON.stringify(history, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexa-history-${new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    this.showNotification('History exported as JSON')
  }

  private copyAsFetch(): void {
    if (!this.selectedRequest) {
      return
    }
    const r = this.selectedRequest
    const headers = { ...r.headers }
    delete headers['host'] // often not needed/allowed in manual fetch

    let code = `fetch("${r.url}", {\n`
    code += `  "method": "${r.method}",\n`
    if (Object.keys(headers).length > 0) {
      code += `  "headers": ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},\n`
    }
    if (r.body) {
      code += `  "body": ${JSON.stringify(r.body, null, 4).replace(/\n/g, '\n  ')},\n`
    }
    code += `});`

    navigator.clipboard
      .writeText(code)
      .then(() => {
        this.showNotification('Copied as fetch to clipboard')
      })
      .catch(() => {
        this.showNotification('Failed to copy to clipboard')
      })
  }

  private showNotification(message: string): void {
    const el = this.panel?.querySelector('.nexa-notification') as HTMLElement
    if (!el) {
      return
    }
    el.textContent = message
    el.classList.add('nexa-notification-show')
    setTimeout(() => {
      el.classList.remove('nexa-notification-show')
    }, 2500)
  }

  private truncateUrl(url: string, max = 35): string {
    try {
      const parsed = new URL(url)
      return parsed.pathname + (parsed.search || '')
    } catch {
      return url.length > max ? url.slice(0, max) + '...' : url
    }
  }

  private formatJson(data: unknown): string {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  private canUseDOM(): boolean {
    return (
      typeof document !== 'undefined' &&
      typeof document.createElement === 'function' &&
      !!document.body
    )
  }

  // Floating icon helpers
  private createFloatingIcon(): void {
    if (!this.canUseDOM()) {
      return
    }

    // Remove any existing floating element to avoid duplicates (HMR or multiple inits)
    try {
      const existingBtn = document.getElementById(
        'nexa-dev-overlay-floating',
      ) as HTMLElement | null
      if (existingBtn) {
        existingBtn.remove()
      }
    } catch {
      // ignore
    }
    if (this.floatingIcon) {
      this.floatingIcon.remove()
      this.floatingIcon = null
    }

    const btn = document.createElement('button')
    btn.id = 'nexa-dev-overlay-floating'
    btn.title = 'Toggle Nexa DevTools'

    const size = this.config.floatingButtonSize ?? 48
    const offset = this.config.floatingButtonOffset ?? 24
    const pos = this.config.position || 'bottom-right'
    const isBottom = pos.includes('bottom')
    const isRight = pos.includes('right')
    const posStyles = `${isBottom ? `bottom: ${offset}px;` : `top: ${offset}px;`} ${isRight ? `right: ${offset}px;` : `left: ${offset}px;`}`

    const floatingTheme =
      this.config.floatingButtonTheme === 'inherit'
        ? this.config.theme
        : this.config.floatingButtonTheme

    let bg = 'linear-gradient(135deg,#0ea5e9,#8b5cf6)'
    let color = '#ffffff'
    let boxShadow = '0 16px 36px rgba(2,6,23,0.34)'
    let border = 'none'

    if (floatingTheme === 'light') {
      bg = 'linear-gradient(135deg,#f8fbff,#e0f2fe)'
      color = '#0f172a'
      boxShadow = '0 14px 30px rgba(15,23,42,0.16)'
      border = '1px solid #d8e4f2'
    }

    const branding = this.config.branding || 'Nexa DevTools'
    const icon =
      this.config.icon ||
      'https://raw.githubusercontent.com/Berea-Soft/nexa/refs/heads/main/src/assets/faviconNew.png'

    btn.style.cssText = `
      position: fixed;
      ${posStyles}
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${border};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483648;
      cursor: pointer;
      box-shadow: ${boxShadow};
      background: ${bg};
      color: ${color};
      font-weight: 700;
      font-size: ${Math.max(12, Math.floor(size / 3))}px;
    `

    btn.innerHTML = `<img src="${icon}" alt="${branding}" style="width:${size - 10}px;height:auto;object-fit:cover;border-radius:999px;display:block;" />`

    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggle()
    })

    btn.addEventListener('mousedown', (ev) => ev.preventDefault())

    document.body.appendChild(btn)
    // If the panel is currently visible, keep the floating button hidden
    btn.style.display = this.visible ? 'none' : 'flex'
    this.floatingIcon = btn
  }

  private showFloatingIcon(): void {
    if (!this.floatingIcon) {
      if (this.config.enabled) {
        this.createFloatingIcon()
      }
      return
    }
    this.floatingIcon.style.display = 'flex'
  }

  private hideFloatingIcon(): void {
    if (!this.floatingIcon) {
      return
    }
    this.floatingIcon.style.display = 'none'
  }

  private applyConfigToUI(newConfig?: Required<DevOverlayConfig>): void {
    this.config = newConfig ?? this.tracker.getConfig()
    const pos = this.config.position
    const isBottom = pos.includes('bottom')
    const isRight = pos.includes('right')
    const offsetPx = `${this.config.floatingButtonOffset ?? 24}px`

    if (this.panel) {
      this.panel.style.bottom = isBottom ? offsetPx : ''
      this.panel.style.top = isBottom ? '' : offsetPx
      this.panel.style.right = isRight ? offsetPx : ''
      this.panel.style.left = isRight ? '' : offsetPx
      if (this.config.theme === 'light') {
        this.panel.classList.add('nexa-theme-light')
      } else {
        this.panel.classList.remove('nexa-theme-light')
      }

      // Update branding and icon if changed
      const logoImg = this.panel.querySelector(
        '.nexa-logo img',
      ) as HTMLImageElement
      const titleSpan = this.panel.querySelector('.nexa-title') as HTMLElement
      const branding = this.config.branding || 'Nexa DevTools'
      const icon =
        this.config.icon ||
        'https://raw.githubusercontent.com/Berea-Soft/nexa/refs/heads/main/src/assets/faviconNew.png'

      if (logoImg) {
        logoImg.src = icon
        logoImg.alt = branding
      }
      if (titleSpan) {
        titleSpan.textContent = branding
      }
    }

    // Recreate floating icon to apply new size/position/theme
    if (this.floatingIcon) {
      this.floatingIcon.remove()
      this.floatingIcon = null
    }
    if (this.config.enabled && (!this.config.devOnly || isDevelopmentEnv())) {
      this.createFloatingIcon()
    }
  }

  // Public helper to allow external callers (e.g. HMR or createDevOverlay)
  // to request the UI to refresh according to the tracker config.
  public refreshConfig(newConfig?: Required<DevOverlayConfig>): void {
    this.applyConfigToUI(newConfig)
  }
}
