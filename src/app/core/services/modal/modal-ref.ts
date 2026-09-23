/**
 * Handle returned by `ModalService.open()`. Inject `MODAL_REF` from the
 * opened component to call `close`/`dismiss` on itself.
 */
export class ModalRef<R = unknown> {
  private resolveFn!: (result: R | undefined) => void;
  private readonly result = new Promise<R | undefined>((resolve) => {
    this.resolveFn = resolve;
  });

  /** Closes the modal, resolving `afterClosed()` with the given result. */
  close(result?: R): void {
    this.resolveFn(result);
  }

  /** Closes the modal without a result (backdrop click, Escape, close button). */
  dismiss(): void {
    this.resolveFn(undefined);
  }

  afterClosed(): Promise<R | undefined> {
    return this.result;
  }
}
