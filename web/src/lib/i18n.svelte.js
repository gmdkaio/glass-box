// The reader's language. Pages are built in English; Portuguese (Brazil) switches in
// the browser after load and is remembered. A first visit follows the browser's language.
const KEY = 'glass-box-lang';

export const i18n = $state({ lang: 'en' });

export function setLang(lang) {
	i18n.lang = lang === 'pt' ? 'pt' : 'en';
	document.documentElement.lang = i18n.lang === 'pt' ? 'pt-BR' : 'en';
	try {
		localStorage.setItem(KEY, i18n.lang);
	} catch {
		// private windows can refuse storage; the choice then lasts until reload
	}
}

// Browser only: call from onMount.
export function initLang() {
	let saved = null;
	try {
		saved = localStorage.getItem(KEY);
	} catch {
		// no storage: fall back to the browser's language
	}
	setLang(saved ?? (navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en'));
}

// t('English', 'Português'): the text, or any value, in the reader's language
export const t = (en, pt) => (i18n.lang === 'pt' ? pt : en);

// For the footer of a module whose toy model reads English text: that text stays English
// in Portuguese too, so the numbers match. Add it as {t('', ' ' + toyNote)}.
export const toyNote = 'Os textos que o modelo de brinquedo lê ficam em inglês, para que os números sejam os mesmos nas duas línguas.';

// locale(): for toLocaleString, so 65,536 reads 65.536 in Portuguese
export const locale = () => (i18n.lang === 'pt' ? 'pt-BR' : 'en-US');

// local(item, 'label'): item.pt.label in Portuguese when there is one, else item.label
export const local = (item, key) => (i18n.lang === 'pt' && item?.pt?.[key] !== undefined ? item.pt[key] : item?.[key]);
