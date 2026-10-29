// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, OnInit, inject } from '@angular/core';
import { CoreSites } from '@services/sites';
import { CoreSite } from '@classes/sites/site';
import { CoreSharedModule } from '@/core/shared.module';
import { CoreAdminBrandingService } from '@features/settings/services/admin-branding';
import { CoreToasts } from '@services/overlays/toasts';
import { CoreAlerts } from '@services/overlays/alerts';
import { CoreLoadings } from '@services/overlays/loadings';
import { CoreCacheManager } from '@services/cache-manager';
import { CoreText } from '@static/text';

export interface ColorPreset {
    name: string;
    hex: string;
}

/**
 * Administration & Multi-Tenant Branding Control Hub.
 *
 * Developer: Suman Kumar Das (fysuman20@gmail.com)
 */
@Component({
    selector: 'page-core-settings-admin',
    templateUrl: 'admin.html',
    styleUrl: 'admin.scss',
    imports: [
        CoreSharedModule,
    ],
})
export default class CoreSettingsAdminPage implements OnInit {

    protected brandingService = inject(CoreAdminBrandingService);

    site?: CoreSite;
    isAdmin = false;
    isManager = false;
    siteUrl = '';
    siteName = '';
    release = '';
    version = '';
    username = '';
    hasIomad = false;

    // Branding state
    primaryColor = '#4f46e5';
    customAppTitle = '';
    customLogoUrl = '';
    borderRadius = '16px';

    // Color Swatches
    readonly colorPresets: ColorPreset[] = [
        { name: 'Indigo Core', hex: '#4f46e5' },
        { name: 'Royal Ocean', hex: '#0284c7' },
        { name: 'Emerald', hex: '#059669' },
        { name: 'Crimson', hex: '#e11d48' },
        { name: 'Royal Violet', hex: '#7c3aed' },
        { name: 'Amber Gold', hex: '#d97706' },
        { name: 'Slate Tech', hex: '#334155' },
    ];

    // Diagnostic State
    pingStatus = '';
    pingLatency = 0;

    async ngOnInit(): Promise<void> {
        this.site = CoreSites.getCurrentSite();

        if (this.site) {
            this.isAdmin = this.site.isAdmin();
            this.isManager = this.site.isManager();
            this.siteUrl = this.site.getURL();
            this.siteName = await this.site.getSiteName();

            const info = this.site.getInfo();
            if (info) {
                this.release = info.release ?? '';
                this.version = info.version ?? '';
                this.username = info.username ?? '';
            }

            this.hasIomad = this.site.wsAvailable('block_tattva_company_admin_get_companies') ||
                this.site.wsAvailable('block_iomad_company_admin_get_companies');
        }

        const branding = await this.brandingService.getBranding();
        this.primaryColor = branding.primaryColor;
        this.customAppTitle = branding.appTitle;
        this.customLogoUrl = branding.logoUrl;
        this.borderRadius = branding.borderRadius;
    }

    /**
     * Select a preset brand color and preview it live.
     */
    selectColor(hex: string): void {
        this.primaryColor = hex;
        this.brandingService.applyPrimaryColor(hex);
    }

    /**
     * Select border radius preset.
     */
    selectRadius(radius: string): void {
        this.borderRadius = radius;
        this.brandingService.applyBorderRadius(radius);
    }

    /**
     * Generate CSS snippet for broadcasting to all students via Moodle server.
     */
    getGeneratedCSS(): string {
        return ':root {\n' +
            `    --ion-color-primary: ${this.primaryColor};\n` +
            `    --brand-color: ${this.primaryColor};\n` +
            `    --core-bottom-tabs-color-selected: ${this.primaryColor};\n` +
            `    --core-bottom-tabs-border-color-active: ${this.primaryColor};\n` +
            `    --core-progressbar-color: ${this.primaryColor};\n` +
            `    --card-radius: ${this.borderRadius};\n` +
            `    --ion-card-radius: ${this.borderRadius};\n` +
            '}';
    }

    /**
     * Copy generated CSS to clipboard for Moodle server configuration.
     */
    copyGeneratedCSS(): void {
        CoreText.copyToClipboard(this.getGeneratedCSS());
        CoreToasts.show({
            message: 'CSS snippet copied to clipboard! Paste into Moodle Site admin > Mobile app > Mobile appearance.',
            duration: 3500,
        });
    }

    /**
     * Copy logo URL to clipboard.
     */
    copyLogoUrl(): void {
        if (!this.customLogoUrl) {
            CoreAlerts.showError('Please enter a custom Logo URL first.');

            return;
        }

        CoreText.copyToClipboard(this.customLogoUrl);
        CoreToasts.show({
            message: 'Logo URL copied to clipboard! Paste into Moodle Site admin > Appearance > Logos.',
            duration: 3500,
        });
    }

    /**
     * Persist dynamic branding locally.
     */
    async saveBranding(): Promise<void> {
        const modal = await CoreLoadings.show('Applying branding...');

        try {
            await this.brandingService.saveBranding({
                primaryColor: this.primaryColor,
                appTitle: this.customAppTitle,
                logoUrl: this.customLogoUrl,
                borderRadius: this.borderRadius,
            });

            await CoreToasts.show({
                message: 'Branding saved on this device successfully!',
                duration: 2500,
            });
        } catch (error) {
            CoreAlerts.showError(error);
        } finally {
            modal.dismiss();
        }
    }

    /**
     * Broadcast branding to Moodle server so all students' apps fetch it.
     */
    async broadcastToServer(): Promise<void> {
        if (!this.site) {
            CoreAlerts.showError('No active connected Moodle site.');

            return;
        }

        const modal = await CoreLoadings.show('Broadcasting to Server...');

        try {
            // 1. Save locally
            await this.brandingService.saveBranding({
                primaryColor: this.primaryColor,
                appTitle: this.customAppTitle,
                logoUrl: this.customLogoUrl,
                borderRadius: this.borderRadius,
            });

            // 2. Attempt direct web service configuration if available
            if (this.site.wsAvailable('core_admin_set_plugin_config_for_external')) {
                await this.site.write('core_admin_set_plugin_config_for_external', {
                    plugin: 'tool_mobile',
                    configs: [
                        { name: 'appcustomcolor', value: this.primaryColor },
                    ],
                });

                await CoreAlerts.show({
                    header: 'Broadcast Successful',
                    message: 'Your branding has been sent to the Moodle server! All students will receive this palette.',
                });
            } else {
                this.copyGeneratedCSS();
                await CoreAlerts.show({
                    header: 'Saved & Ready for Students',
                    message: 'Mobile CSS copied to clipboard!\n\nPaste into Site admin > Mobile app > Mobile appearance.',
                });
            }
        } catch {
            this.copyGeneratedCSS();
            await CoreAlerts.show({
                header: 'Branding Saved Locally',
                message: 'Saved on your device. CSS copied to clipboard! Paste into Site admin > Mobile app > Mobile appearance.',
            });
        } finally {
            modal.dismiss();
        }
    }

    /**
     * Reset to original defaults.
     */
    async resetBranding(): Promise<void> {
        const confirmed = await CoreAlerts.confirm('Reset all custom branding and colors to default?');
        if (!confirmed) {
            return;
        }

        await this.brandingService.resetDefaults();
        this.primaryColor = '#4f46e5';
        this.customAppTitle = '';
        this.customLogoUrl = '';
        this.borderRadius = '16px';

        await CoreToasts.show({
            message: 'Branding restored to defaults.',
            duration: 2500,
        });
    }

    /**
     * Purge all web service and page caches.
     */
    async purgeAllCaches(): Promise<void> {
        const modal = await CoreLoadings.show('Purging all caches...');

        try {
            if (this.site) {
                await this.site.invalidateWsCache();
            }
            await CoreCacheManager.invalidate();

            await CoreToasts.show({
                message: 'All site data & web service caches successfully purged.',
                duration: 3000,
            });
        } catch (error) {
            CoreAlerts.showError(error);
        } finally {
            modal.dismiss();
        }
    }

    /**
     * Test web service endpoint latency & token response.
     */
    async pingWebService(): Promise<void> {
        if (!this.site) {
            return;
        }

        const start = Date.now();
        this.pingStatus = 'Testing connection...';

        try {
            await this.site.read('core_webservice_get_site_info', {}, {
                emergencyCache: false,
                getFromCache: false,
            });

            this.pingLatency = Date.now() - start;
            this.pingStatus = `Success: Connected in ${this.pingLatency}ms`;
        } catch (error) {
            this.pingStatus = `Failed: ${(error as Error).message || error}`;
        }
    }

    /**
     * Copies diagnostic overview to clipboard.
     */
    copyDiagnostics(): void {
        const diagnosticData = {
            developer: 'Suman Kumar Das <fysuman20@gmail.com>',
            appVersion: '5.2.1-custom',
            siteUrl: this.siteUrl,
            siteName: this.siteName,
            release: this.release,
            version: this.version,
            isAdmin: this.isAdmin,
            isManager: this.isManager,
            hasIomad: this.hasIomad,
            branding: {
                primaryColor: this.primaryColor,
                borderRadius: this.borderRadius,
                customAppTitle: this.customAppTitle,
            },
        };

        CoreText.copyToClipboard(JSON.stringify(diagnosticData, null, 2));
        CoreToasts.show({
            message: 'Diagnostic summary copied to clipboard!',
            duration: 2000,
        });
    }

}
