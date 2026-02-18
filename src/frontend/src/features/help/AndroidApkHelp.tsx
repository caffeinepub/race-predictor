import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AndroidApkHelp() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        How to Get an Android APK
                    </CardTitle>
                    <CardDescription>
                        Convert this web app into a usable Android APK file
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertDescription>
                            This is a web application. To use it as an Android app, you need to wrap it in a WebView using a website-to-APK generator.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-base mb-2">Step-by-Step Instructions:</h3>
                            <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                                <li className="pl-2">
                                    <span className="font-medium text-foreground">Deploy your app</span>
                                    <p className="ml-6 mt-1">Make sure your app is accessible via a public URL on the internet.</p>
                                </li>
                                <li className="pl-2">
                                    <span className="font-medium text-foreground">Visit a website-to-APK generator</span>
                                    <p className="ml-6 mt-1">
                                        Go to a service like{' '}
                                        <a
                                            href="https://websitetoapk.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                            websitetoapk.com
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </p>
                                </li>
                                <li className="pl-2">
                                    <span className="font-medium text-foreground">Enter your app URL</span>
                                    <p className="ml-6 mt-1">Paste the deployed URL of this application into the generator.</p>
                                </li>
                                <li className="pl-2">
                                    <span className="font-medium text-foreground">Customize (optional)</span>
                                    <p className="ml-6 mt-1">Upload an app icon, set the app name, and configure other settings as desired.</p>
                                </li>
                                <li className="pl-2">
                                    <span className="font-medium text-foreground">Generate APK</span>
                                    <p className="ml-6 mt-1">Click the generate button and wait for the APK to be created.</p>
                                </li>
                                <li className="pl-2">
                                    <span className="font-medium text-foreground">Download and install</span>
                                    <p className="ml-6 mt-1">Download the APK file to your Android device and install it. You may need to enable "Install from unknown sources" in your device settings.</p>
                                </li>
                            </ol>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <h3 className="font-semibold text-base mb-2">Important Notes:</h3>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                <li className="pl-2">
                                    <span className="text-foreground">The APK wraps your web app in a WebView</span> - it's essentially a browser window displaying your site.
                                </li>
                                <li className="pl-2">
                                    <span className="text-foreground">Your app must be deployed and accessible online</span> for the APK to work.
                                </li>
                                <li className="pl-2">
                                    <span className="text-foreground">This method requires no coding</span> and works immediately.
                                </li>
                                <li className="pl-2">
                                    <span className="text-foreground">The APK is not published to Google Play Store</span> - it's for personal use or direct distribution.
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
