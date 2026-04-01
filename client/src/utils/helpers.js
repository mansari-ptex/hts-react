import { escapeRegExp } from '../engine/htsEngine.js';

export function highlightText(text, highlightEnabled, searchWords = [], genderTerms = [], fabricTerms = [], featureTerms = []) {
  if (!highlightEnabled) return text;

  let highlighted = text;

  const wordRegex = (word) =>
    new RegExp(`(?<![a-zA-Z-])(${escapeRegExp(word)})(s)?(?![a-zA-Z-])`, 'gi');

  searchWords.forEach(word => {
    highlighted = highlighted.replace(wordRegex(word), '<span class="highlight-search">$1$2</span>');
  });

  genderTerms.forEach(word => {
    const regex = new RegExp(`\\b(${escapeRegExp(word)})(['’]s)?\\b`, 'gi');
    highlighted = highlighted.replace(regex, '<span class="highlight-gender">$&</span>');
  });

  fabricTerms.forEach(word => {
    highlighted = highlighted.replace(wordRegex(word), '<span class="highlight-fabric">$1$2</span>');
  });

  featureTerms.forEach(word => {
    highlighted = highlighted.replace(wordRegex(word), '<span class="highlight-feature">$1$2</span>');
  });

  return highlighted;
}

export function highlightInheritedParts(fullDescription, itemDescription, highlightEnabled, searchWords = [], genderTerms = [], fabricTerms = [], featureTerms = []) {
  if (!highlightEnabled) return fullDescription;
  
  const parts = fullDescription.split(' > ');
  let highlightedParts = [];

  const itemDescIndex = parts.findIndex(part =>
    part.trim().toLowerCase() === itemDescription.trim().toLowerCase()
  );

  parts.forEach((part, index) => {
    let highlightedPart = highlightText(part, highlightEnabled, searchWords, genderTerms, fabricTerms, featureTerms);

    if (index < itemDescIndex && itemDescIndex !== -1) {
      if (!highlightedPart.includes('highlight-search')) {
        highlightedPart = `<span class="highlight-inherited">${highlightedPart}</span>`;
      } else {
        highlightedPart = highlightedPart.replace(
          /([^>]+?)(?=<span class="highlight-search">|$)/g,
          (match) => match.trim() ? `<span class="highlight-inherited">${match}</span>` : match
        );
      }
    }
    highlightedParts.push(highlightedPart);
  });

  return highlightedParts.join(' > ');
}
