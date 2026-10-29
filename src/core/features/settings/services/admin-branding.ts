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

import { Injectable } from '@angular/core';
import { CoreConfig } from '@services/config';
import { CoreLogger } from '@static/logger';

export interface BrandingConfig {
    primaryColor: string;
    appTitle: string;
    logoUrl: string;
    borderRadius: string;
}

/**
 * Service to manage Admin dynamic branding, tenant themes, and visual customizations.
 *
 * Developer: Suman Kumar Das (fysuman20@gmail.com)
 */
@Injectable({ providedIn: 'root' })
export class CoreAdminBrandingService {

    static readonly CONFIG_PRIMARY_COLOR = 'admin_branding_primary_color';
    static readonly CONFIG_APP_TITLE = 'admin_branding_app_title';
    static readonly CONFIG_LOGO_URL = 'admin_branding_logo_url';
    static readonly CONFIG_BORDER_RADIUS = 'admin_branding_border_radius';

    protected logger = CoreLogger.getInstance('CoreAdminBrandingService');

    /**
     * Initializes and applies stored dynamic branding at app boot.
     */
    async initialize(): Promise<void> {
        try {
            await CoreConfig.ready();
            const color = await CoreConfig.get<string>(CoreAdminBrandingService.CONFIG_PRIMARY_COLOR, '#4f46e5');
            const borderRadius = await CoreConfig.get<string>(CoreAdminBrandingService.CONFIG_BORDER_RADIUS, '16px');

            this.applyPrimaryColor(color);
            this.applyBorderRadius(borderRadius);
        } catch (error) {
            this.logger.debug('No stored custom branding to apply or failed to load:', error);
        }
    }

    /**
     * Applies primary accent color to CSS variables live in the DOM.
     *
     * @param colorHex Hex color code (e.g. #4f46e5).
     */
    applyPrimaryColor(colorHex: string): void {
        if (!colorHex || typeof document === 'undefined') {
            return;
        }

        const root = document.documentElement;
        root.style.setProperty('--ion-color-primary', colorHex);
        root.style.setProperty('--brand-color', colorHex);
        root.style.setProperty('--core-bottom-tabs-color-selected', colorHex);
        root.style.setProperty('--core-bottom-tabs-border-color-active', colorHex);
        root.style.setProperty('--core-progressbar-color', colorHex);

        const rgb = this.hexToRgb(colorHex);
        if (rgb) {
            root.style.setProperty('--ion-color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
    }

    /**
     * Applies card and element border radius live in the DOM.
     *
     * @param radius Radius string (e.g. '16px', '8px', '9999px').
     */
    applyBorderRadius(radius: string): void {
        if (!radius || typeof document === 'undefined') {
            return;
        }

        const root = document.documentElement;
        root.style.setProperty('--card-radius', radius);
        root.style.setProperty('--ion-card-radius', radius);
        root.style.setProperty('--radius-lg', radius);
    }

    /**
     * Helper to convert HEX to RGB.
     */
    hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : null;
    }

    /**
     * Saves branding configuration permanently.
     */
    async saveBranding(config: Partial<BrandingConfig>): Promise<void> {
        if (config.primaryColor) {
            await CoreConfig.set(CoreAdminBrandingService.CONFIG_PRIMARY_COLOR, config.primaryColor);
            this.applyPrimaryColor(config.primaryColor);
        }
        if (config.appTitle !== undefined) {
            await CoreConfig.set(CoreAdminBrandingService.CONFIG_APP_TITLE, config.appTitle);
        }
        if (config.logoUrl !== undefined) {
            await CoreConfig.set(CoreAdminBrandingService.CONFIG_LOGO_URL, config.logoUrl);
        }
        if (config.borderRadius) {
            await CoreConfig.set(CoreAdminBrandingService.CONFIG_BORDER_RADIUS, config.borderRadius);
            this.applyBorderRadius(config.borderRadius);
        }
    }

    /**
     * Gets current branding configuration.
     */
    async getBranding(): Promise<BrandingConfig> {
        const primaryColor = await CoreConfig.get<string>(CoreAdminBrandingService.CONFIG_PRIMARY_COLOR, '#4f46e5');
        const appTitle = await CoreConfig.get<string>(CoreAdminBrandingService.CONFIG_APP_TITLE, '');
        const logoUrl = await CoreConfig.get<string>(CoreAdminBrandingService.CONFIG_LOGO_URL, '');
        const borderRadius = await CoreConfig.get<string>(CoreAdminBrandingService.CONFIG_BORDER_RADIUS, '16px');

        return {
            primaryColor,
            appTitle,
            logoUrl,
            borderRadius,
        };
    }

    /**
     * Resets branding to default values.
     */
    async resetDefaults(): Promise<void> {
        await CoreConfig.delete(CoreAdminBrandingService.CONFIG_PRIMARY_COLOR);
        await CoreConfig.delete(CoreAdminBrandingService.CONFIG_APP_TITLE);
        await CoreConfig.delete(CoreAdminBrandingService.CONFIG_LOGO_URL);
        await CoreConfig.delete(CoreAdminBrandingService.CONFIG_BORDER_RADIUS);

        this.applyPrimaryColor('#4f46e5');
        this.applyBorderRadius('16px');
    }

}
