const locale = Intl.DateTimeFormat().resolvedOptions().locale;

export function localizeShortDate(date) {
    return new Intl.DateTimeFormat(locale, {month: '2-digit', day: '2-digit', year: '2-digit'}).format(date);
}