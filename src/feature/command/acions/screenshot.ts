import { ScreenshotService } from '../../../utils/screenshot.service';

export async function takeRelayPulseScreenshot(
    screenshotService: ScreenshotService,
    provider: string = '88code',
    period: string = '24h'
): Promise<Buffer> {
    const url = `https://relaypulse.top/?provider=${provider}&period=${period}`;
    
    return await screenshotService.takeScreenshot({
        url,
        width: 1200,
        height: 800,
        timeout: 30000,
        waitUntil: 'networkidle0',
    });
}
