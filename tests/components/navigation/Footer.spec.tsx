import { test, expect } from '@playwright/experimental-ct-react';
import Footer from '@/app/ui/navigation/Footer';

test.describe('footer', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('has copyright text', async ({ mount }) => {
    const component = await mount(<Footer />);
    const copyright = component.getByText('AlgoSangaku');
    await expect(copyright).toBeVisible();
  });
});
