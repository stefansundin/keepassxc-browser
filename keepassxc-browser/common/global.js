'use strict';

export const EXTENSION_NAME = 'KeePassXC-Browser';

// Site Preferences ignore options
export const IGNORE_NOTHING = 'ignoreNothing';
export const IGNORE_NORMAL = 'ignoreNormal';
export const IGNORE_AUTOSUBMIT = 'ignoreAutoSubmit';
export const IGNORE_FULL = 'ignoreFull';

// Credential sorting options
export const SORT_BY_TITLE = 'sortByTitle';
export const SORT_BY_USERNAME = 'sortByUsername';
export const SORT_BY_GROUP_AND_TITLE = 'sortByGroupAndTitle';
export const SORT_BY_GROUP_AND_USERNAME = 'sortByGroupAndUsername';
export const SORT_BY_MATCHING_CREDENTIALS_SETTING = 'sortByMatchingCredentials';
export const SORT_BY_RELEVANT_ENTRY = 'sortByRelevantEntry';

// Update check intervals
export const CHECK_UPDATE_NEVER = 0;
export const CHECK_UPDATE_THREE_DAYS = 3;
export const CHECK_UPDATE_ONE_WEEK = 7;
export const CHECK_UPDATE_ONE_MONTH = 30;

export const URL_WILDCARD = '1kpxcwc1';
export const schemeSegment = '(\\*|http|https|ws|wss|ftp)';
export const hostSegment = '(\\*|(?:\\*\\.)?(?:[^/*]+))?';

export function isFirefox() {
    return navigator.userAgent.includes('Firefox') || navigator.userAgent.includes('Gecko/');
}

export function isEdge() {
    return navigator.userAgent.includes('Edg');
}

export function showNotification(message) {
    browser.notifications.create({
        'type': 'basic',
        'iconUrl': browser.extension.getURL('icons/keepassxc_64x64.png'),
        'title': 'KeePassXC-Browser',
        'message': message
    });
}

export const AssociatedAction = {
    NOT_ASSOCIATED: 0,
    ASSOCIATED: 1,
    NEW_ASSOCIATION: 2,
    CANCELED: 3
};

export const ManualFill = {
    NONE: 0,
    PASSWORD: 1,
    BOTH: 2
};

// Match hostname or path with wildcards
function matchWithRegex(firstUrlPart, secondUrlPart, hostnameUsed = false) {
    if (firstUrlPart === secondUrlPart) {
        return true;
    }

    // If there's no wildcard with hostname, just compare directly
    if (hostnameUsed && !firstUrlPart.includes(URL_WILDCARD) && firstUrlPart !== secondUrlPart) {
        return false;
    }

    // Escape illegal characters
    let re = firstUrlPart.replaceAll(/[!\^$\+\-\(\)@<>]/g, '\\$&');
    if (hostnameUsed) {
        // Replace all host parts with wildcards so e.g. https://*.example.com is accepted with https://example.com
        re = re.replaceAll(`${URL_WILDCARD}.`, '(.*?)');
    }

    // Replace any remaining wildcards for paths
    re = re.replaceAll(URL_WILDCARD, '(.*?)');

    return secondUrlPart.match(new RegExp(re));
}

// Matches URL in Site Preferences with the current URL
export function siteMatch(site, url) {
    try {
        site = site.replaceAll('*', URL_WILDCARD);
        const siteUrl = new URL(site);
        const currentUrl = new URL(url);

        // Match scheme and port
        if (siteUrl.protocol !== currentUrl.protocol || siteUrl.port !== currentUrl.port) {
            return false;
        }

        // Match hostname and path
        if (!matchWithRegex(siteUrl.hostname, currentUrl.hostname, true)
            || !matchWithRegex(siteUrl.pathname, currentUrl.pathname)) {
            return false;
        }

        return true;
    } catch(e) {
        logError(e);
    }

    return false;
}

export function slashNeededForUrl(pattern) {
    const matchPattern = new RegExp(`^${schemeSegment}://${hostSegment}$`);
    return matchPattern.exec(pattern);
}

// Returns the top level domain, e.g. https://another.example.co.uk -> example.co.uk
// This is done because a top level domain will probably give better matches with Auto-Type than a full hostname.
export function getTopLevelDomainFromUrl(hostname) {
    const domainRegex = new RegExp(/(\w+).(com|net|org|edu|co)*(.\w+)$/g);
    const domainMatch = domainRegex.exec(hostname);

    if (domainMatch) {
        return domainMatch[0];
    }

    return hostname;
}

export function tr(key, params) {
    return browser.i18n.getMessage(key, params);
}

// Removes everything after '?' from URL
export function trimURL(url) {
    return url.indexOf('?') !== -1 ? url.split('?')[0] : url;
}

export function debugLogMessage(message, extra) {
    console.log(`[Debug ${getFileAndLine()}] ${EXTENSION_NAME} - ${message}`);

    if (extra) {
        console.log(extra);
    }
}

export function logError(message) {
    console.log(`[Error ${getFileAndLine()}] ${EXTENSION_NAME} - ${message}`);
}

// Returns file name and line number from error stack
function getFileAndLine() {
    const err = new Error().stack.split('\n');
    const line = err[4] ?? err.at(-1);
    const result = line.substring(line.lastIndexOf('/') + 1, line.lastIndexOf(':'));

    return result;
}

export async function getCurrentTab() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs.length > 0 ? tabs[0] : undefined;
}

HTMLElement.prototype.show = function() {
    this.style.display = 'block';
};

HTMLElement.prototype.hide = function() {
    this.style.display = 'none';
};
