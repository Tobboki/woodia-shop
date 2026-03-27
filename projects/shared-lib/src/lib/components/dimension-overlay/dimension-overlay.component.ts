import { Component, input } from '@angular/core'
import type { DimensionLabel2D, DimensionLine2D } from './dimension-overlay.types'

/**
 * Reusable overlay for dimension lines (with arrows) and labels (in ellipses).
 * Pass 2D coordinates (e.g. from projecting 3D model points to screen).
 * Use over a canvas or viewport; position the overlay with CSS (e.g. position: absolute; inset: 0).
 */
@Component({
  selector: 'z-dimension-overlay',
  standalone: true,
  template: `
    <div class="dimension-overlay-root">
      <svg
        class="dimension-overlay-svg"
        [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id="dimension-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
          </marker>
        </defs>
        @for (line of lines(); track line.id) {
          <line
            class="dimension-line"
            [attr.x1]="line.x1"
            [attr.y1]="line.y1"
            [attr.x2]="line.x2"
            [attr.y2]="line.y2"
            marker-end="url(#dimension-arrow)"
            marker-start="url(#dimension-arrow)"
          />
        }
      </svg>
      @for (label of labels(); track label.id) {
        <div
          class="dimension-label dimension-ellipse"
          [class.dimension-label-total]="label.variant === 'total'"
          [class.dimension-label-cell]="label.variant === 'cell'"
          [style.left.px]="label.x"
          [style.top.px]="label.y"
        >
          {{ label.text }}
        </div>
      }
    </div>
  `,
  styleUrl: './dimension-overlay.component.scss',
})
export class DimensionOverlayComponent {
  /** Dimension lines in 2D (start/end). Draws a line with arrow markers. */
  readonly lines = input<DimensionLine2D[]>([])
  /** Dimension labels in 2D. Rendered in ellipse/pill. */
  readonly labels = input<DimensionLabel2D[]>([])
  /** Overlay width (matches viewport; used for SVG viewBox). */
  readonly width = input<number>(1)
  /** Overlay height (matches viewport; used for SVG viewBox). */
  readonly height = input<number>(1)
}
