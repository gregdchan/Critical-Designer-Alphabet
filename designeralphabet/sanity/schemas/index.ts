import { achievements } from './achievements';
import { cards } from './cards';
import { pages } from './pages';
import { themes } from './themes';
import { i18nText } from './objects/i18n-text';
import { resourceLink } from './objects/resource-link';
import { pageSection } from './objects/page-section';

export const schemaTypes = [
	// objects
	i18nText,
	resourceLink,
	pageSection,
	// documents
	cards,
	themes,
	achievements,
	pages
];
