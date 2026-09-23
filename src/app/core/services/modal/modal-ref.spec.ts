import { ModalRef } from './modal-ref';

describe('ModalRef', () => {
  it('resolves afterClosed() with the result passed to close()', async () => {
    const ref = new ModalRef<string>();

    ref.close('saved');

    await expect(ref.afterClosed()).resolves.toBe('saved');
  });

  it('resolves afterClosed() with undefined when dismissed', async () => {
    const ref = new ModalRef<string>();

    ref.dismiss();

    await expect(ref.afterClosed()).resolves.toBeUndefined();
  });

  it('ignores a second close()/dismiss() call — the first result wins', async () => {
    const ref = new ModalRef<string>();

    ref.close('first');
    ref.dismiss();
    ref.close('second');

    await expect(ref.afterClosed()).resolves.toBe('first');
  });
});
