import { test, expect } from '@/tests/fixtures.ct';
import Footer from '@/app/ui/navigation/Footer';

test.describe('footer', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('should allow me to see copyright text', async ({ mount }) => {
    const component = await mount(<Footer />);
    const copyright = component.getByText('AlgoSangaku');
    await expect(copyright).toBeVisible();
  });
});
