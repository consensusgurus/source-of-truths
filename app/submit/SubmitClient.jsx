'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, ChevronDown } from 'lucide-react';
import { TYPES } from '@/lib/data';
import { postList } from '@/lib/api';
import Grain from '../Grain';
import Footer from '../Footer';
import { T } from '@/lib/theme';

function SubmitView({ mode = 'list', onBack, onSubmit }) {
  const isQuiz = mode === 'quiz';
  const COPY = isQuiz
    ? {
        back: 'Back to all quizzes',
        headLine1: 'Submit your',
        headLine2: 'quiz idea',
        intro: 'Only a headline is required. Give us the quiz and, if you like, the answers in order, and an editor will build the rest.',
        headlineLabel: 'Quiz title (required)',
        headlinePlaceholder: 'Name the highest-grossing Tom Hanks movies',
        blurbPlaceholder: 'A quick pitch for the quiz',
        picksHeading: 'The answers, in order (optional)',
        picksHint: 'filled · #1 at top',
        slotPlaceholder: (n) => `Answer number ${n} (optional)`,
        submit: 'Submit quiz',
        submitting: 'Sending...',
        footnote: 'Submitted quizzes are reviewed before going live',
      }
    : {
        back: 'Back to all lists',
        headLine1: 'Submit your',
        headLine2: 'top list',
        intro: 'Only a headline is required. Add as much or as little as you want, and an editor will handle the rest.',
        headlineLabel: 'Headline (required)',
        headlinePlaceholder: 'Best beaches in Sicily',
        blurbPlaceholder: 'A quick pitch for your readers',
        picksHeading: 'Your picks, in order (optional)',
        picksHint: 'filled · #1 at top',
        slotPlaceholder: (n) => `Pick number ${n} (optional)`,
        submit: 'Submit list',
        submitting: 'Sending...',
        footnote: 'Submitted lists are reviewed before going live',
      };
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('other');
  const [blurb, setBlurb] = useState('');
  const [criteria, setCriteria] = useState('');
  const [items, setItems] = useState(Array(10).fill(''));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateItem(idx, val) {
    const next = [...items];
    next[idx] = val;
    setItems(next);
  }

  function addSlot() {
    if (items.length >= 30) return;
    setItems([...items, '']);
  }

  function removeSlot(idx) {
    if (items.length <= 3) return;
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
  }

  function handleSubmit() {
    setError('');
    if (!title.trim()) return setError(isQuiz ? 'Add a title for your quiz' : 'Add a headline for your list');

    const cleanItems = items.map((i) => i.trim()).filter(Boolean).map((i) => i.slice(0, 90));

    const newList = {
      id: `${isQuiz ? 'quiz' : 'user'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim().slice(0, 90),
      category: category.trim().slice(0, 40) || (isQuiz ? 'Quiz Idea' : 'Reader Pick'),
      type: type,
      // Always use 'search' as link type; admin can change on the backend.
      linkType: 'search',
      blurb: blurb.trim().slice(0, 220) || (isQuiz ? 'A reader-submitted quiz idea.' : 'A reader-submitted list.'),
      isUserSubmitted: true,
      // Marks this as a quiz idea so the editor routes it to lib/quizzes.js
      // rather than lib/data.js. Same backend, same review queue.
      submissionKind: isQuiz ? 'quiz' : 'list',
      submittedAt: Date.now(),
      defaultSource: 'ai',
      sources: {
        ai: {
          label: criteria.trim() ? `As Submitted: ${criteria.trim().slice(0, 100)}` : 'As Submitted',
          items: cleanItems,
        },
      },
      vote: {
        items: cleanItems,
      },
    };
    setSubmitting(true);
    onSubmit(newList);
  }

  const labelStyle = {
    fontFamily: 'Manrope, monospace',
    fontSize: 10,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: T.slate,
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: `1.5px solid ${T.ink}`,
    padding: '8px 0',
    fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
    fontSize: 18,
    color: T.ink,
    outline: 'none',
    fontVariationSettings: '"SOFT" 100',
  };

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    fontSize: 16,
    minHeight: 60,
    fontFamily: 'Manrope, sans-serif',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
    background: 'transparent',
    paddingRight: 28,
    cursor: 'pointer',
  };

  const filledCount = items.filter((i) => i.trim()).length;

  return (
    <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          fontFamily: 'Manrope, monospace',
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: T.ink,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 0',
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        {COPY.back}
      </button>

      <div style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 20, marginTop: 16, marginBottom: 32 }}>
        <div
          style={{
            fontFamily: 'Manrope, monospace',
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: T.accent,
            marginBottom: 10,
          }}
        >
          Letter to the Editor
        </div>
        <h1
          style={{
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(42px, 10vw, 84px)',
            lineHeight: 0.9,
            letterSpacing: '-0.015em',
            margin: 0,
            color: T.ink,
            fontVariationSettings: '"SOFT" 100',
          }}
        >
          {COPY.headLine1}
          <br />
          <span style={{ fontStyle: 'italic', color: T.accent }}>{COPY.headLine2}</span>
        </h1>
        <p
          style={{
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontStyle: 'italic',
            fontSize: 17,
            lineHeight: 1.45,
            margin: '16px 0 0',
            color: T.slate,
            maxWidth: 560,
          }}
        >
          {COPY.intro}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <label style={labelStyle}>{COPY.headlineLabel}</label>
          <input
            style={inputStyle}
            type="text"
            placeholder={COPY.headlinePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={90}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={labelStyle}>Tag (optional)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Sicily, Travel, anything"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={40}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Type (optional)</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              {TYPES.filter((t) => t.id !== 'all').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              strokeWidth={2.5}
              style={{ position: 'absolute', right: 4, bottom: 12, pointerEvents: 'none', color: T.ink }}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>One-line description (optional)</label>
          <textarea
            style={textareaStyle}
            placeholder={COPY.blurbPlaceholder}
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            maxLength={220}
            rows={2}
          />
        </div>

        <div>
          <label style={labelStyle}>How you ranked them (optional)</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Personal favorites, by reputation, by sand quality..."
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            maxLength={140}
          />
        </div>

        <div>
          <div
            style={{
              borderTop: `1px solid ${T.ink}`,
              paddingTop: 20,
              marginTop: 8,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <h3
              style={{
                fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                fontStyle: 'italic',
                fontSize: 22,
                margin: 0,
                color: T.ink,
              }}
            >
              {COPY.picksHeading}
            </h3>
            <span
              style={{
                fontFamily: 'Manrope, monospace',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: T.slate,
              }}
            >
              {filledCount} {COPY.picksHint}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((val, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: T.surfaceAlt,
                  border: `1.5px solid ${T.ink}`,
                  padding: '10px 14px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                    fontWeight: 900,
                    fontSize: 22,
                    color: i === 0 ? T.accent : T.ink,
                    minWidth: 28,
                    fontFeatureSettings: '"lnum" 1',
                    fontVariationSettings: '"SOFT" 100',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => updateItem(i, e.target.value)}
                  placeholder={COPY.slotPlaceholder(i + 1)}
                  maxLength={90}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                    fontSize: 17,
                    color: T.ink,
                    outline: 'none',
                    padding: '4px 0',
                    fontVariationSettings: '"SOFT" 100',
                  }}
                />
                {items.length > 3 && (
                  <button
                    onClick={() => removeSlot(i)}
                    aria-label="Remove slot"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: T.slate,
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {items.length < 30 && (
            <button
              onClick={addSlot}
              style={{
                marginTop: 12,
                background: 'transparent',
                color: T.ink,
                border: `1.5px dashed ${T.ink}`,
                padding: '10px 16px',
                fontFamily: 'Manrope, monospace',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <Plus size={12} strokeWidth={3} />
              Add another slot
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: 14,
              border: `1.5px solid ${T.accent}`,
              background: 'rgba(192, 57, 43, 0.08)',
              fontFamily: 'Manrope, sans-serif',
              fontSize: 14,
              color: T.accent,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <X size={14} strokeWidth={2.5} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              color: T.ink,
              border: `1.5px solid ${T.ink}`,
              padding: '14px 24px',
              fontFamily: 'Manrope, monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: T.ink,
              color: T.surface,
              border: `1.5px solid ${T.ink}`,
              padding: '14px 28px',
              fontFamily: 'Manrope, monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: `3px 3px 0 ${T.accent}`,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? COPY.submitting : COPY.submit}
          </button>
        </div>

        <p
          style={{
            fontFamily: 'Manrope, monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: T.slate,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          {COPY.footnote}
        </p>
        <p style={{ fontSize: 13, color: T.slate, textAlign: 'center', margin: '8px 0 0' }}>
          Questions? Email <a href="mailto:admin@mindloftdaily.com" style={{ color: 'inherit', fontWeight: 700 }}>admin@mindloftdaily.com</a>.
        </p>
      </div>
    </div>
  );
}

export default function SubmitClient() {
  const router = useRouter();
  // Quiz mode is opted into with /submit?for=quiz (the "Submit a Quiz" button on
  // the /quizzes page). Read it off the URL on mount so we don't need a Suspense
  // boundary around useSearchParams. Same form and backend power both; only the
  // copy, the back target, and the submission marker change.
  const [mode, setMode] = useState('list');
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('for') === 'quiz') setMode('quiz');
    } catch {}
  }, []);

  function goBack() {
    router.push(mode === 'quiz' ? '/quizzes' : '/');
  }

  async function handleSubmit(newList) {
    const result = await postList(newList);
    if (result && result.ok) {
      router.push(`/submit/thanks`);
    } else {
      alert(`Could not save your ${mode === 'quiz' ? 'quiz' : 'list'}. Please try again.`);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.surface,
        color: T.ink,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Grain />
      <SubmitView mode={mode} onBack={goBack} onSubmit={handleSubmit} />
      <Footer />
    </div>
  );
}
