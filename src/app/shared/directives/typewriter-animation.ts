import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

interface TypewriterState {
  isAnimating: boolean;
  currentCharIndex: number;
  totalChars: number;
  animationId?: number;
  originalText: string;
}

@Directive({
  selector: '[typewriterAnimation]',
})
export class TypewriterAnimation {
  constructor() {
    effect(() => {
      const newText = this.text();
      const enabled = this.isEnabled();

      if (enabled && newText && newText !== this._lastAnimatedText) {
        this._startTypewriterAnimation(newText);
        this._lastAnimatedText = newText;
      } else if (!enabled && this._state().isAnimating) {
        this._stopAnimation();
      }
    });

    this._destroyRef.onDestroy(() => {
      this._stopAnimation();
    });
  }

  public readonly text = input.required<string>();
  public readonly isEnabled = input<boolean>(true);

  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _typingSpeed = 40;
  private readonly _state = signal<TypewriterState>({
    isAnimating: false,
    currentCharIndex: 0,
    totalChars: 0,
    originalText: '',
  });

  private _lastAnimatedText = '';

  private _startTypewriterAnimation(text: string): void {
    this._stopAnimation();

    const element = this._elementRef.nativeElement;
    element.textContent = '';

    this._state.set({
      isAnimating: true,
      currentCharIndex: 0,
      totalChars: text.length,
      originalText: text,
    });

    this._animateCharacters();
  }

  private _animateCharacters(): void {
    const state = this._state();

    if (!state.isAnimating || state.currentCharIndex >= state.totalChars) {
      this._completeAnimation();
      return;
    }

    const charsPerFrame = Math.max(1, Math.floor(this._typingSpeed / 60));
    const nextCharIndex = Math.min(
      state.currentCharIndex + charsPerFrame,
      state.totalChars
    );

    const revealedText = state.originalText.substring(0, nextCharIndex);
    this._elementRef.nativeElement.textContent = revealedText;

    this._state.update((s) => ({
      ...s,
      currentCharIndex: nextCharIndex,
    }));

    const animationId = requestAnimationFrame(() => {
      this._animateCharacters();
    });

    this._state.update((s) => ({ ...s, animationId }));
  }

  private _completeAnimation(): void {
    const state = this._state();
    this._elementRef.nativeElement.textContent = state.originalText;

    this._state.update((s) => ({
      ...s,
      isAnimating: false,
      animationId: undefined,
    }));
  }

  private _stopAnimation(): void {
    const state = this._state();

    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
    }

    if (state.isAnimating) {
      this._completeAnimation();
    }
  }
}
