/*
 *  character.js
 *
 *  Character related services.
 *
 *  Note: The last ucs-2 character encoding is 0xfffd.
 */
"use strict";

module.exports = {
  isSpecial,
  isAlpha,
  isAlphaNumeric,
  isDigit,
  isNumeric,
  isControl,
  isOperator,
  isWhitespace,
  isEndOfLine,
  isEndOfStream
};

function combineRegExps(...args) {
  let sExpr = args[0].source;
  for (let i = 1; i < args.length; i++)
    sExpr = sExpr.substr(0, sExpr.length - 1) + args[i].source.substr(1);
  return (new RegExp(sExpr));
}

const Alphas = /[a-zA-Z]/;
const Digits = /[0-9]/;
const EndLine = /[\n\r\u2028\u2029]/;
const Bells = /[\b]/;
const Spacing = /[\f\t\v]/;
const Spaces = /[ \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/;
const Operators = /[~\!@#\$%\^&\*\(\)_\+-\=\{\}\|\[\]\\\:";\'<>\?,\.\/]/;

const AlphaNumerics = combineRegExps(Alphas, Digits);
const Controls = combineRegExps(EndLine, Bells, Spacing);
const Whitespace = combineRegExps(EndLine, Spacing, Spaces);
const NonSpecial = combineRegExps(AlphaNumerics, Whitespace, Operators, Bells);
const EndOfStream = '\uffff';

// Will need to be extend the following functions properly handle ucs-2 extended characters

function isSpecial(ch) {
  return (!NonSpecial.test(ch));
}

function isAlpha(ch) {
  return (Alphas.test(ch));
}

function isAlphaNumeric(ch) {
  return (AlphaNumerics.test(ch));
}

function isDigit(ch) {
  return (Digits.test(ch));
}

function isNumeric(ch) {
  return (isDigit(ch));
}

function isControl(ch) {
  return (Controls.test(ch));
}

function isOperator(ch) {
  return (Operators.test(ch));
}

function isWhitespace(ch) {
  return (Whitespace.test(ch));
}

function isEndOfLine(ch) {
  return (EndLine.test(ch));
}

function isEndOfStream(ch) {
  return (ch === EndOfStream);
}
