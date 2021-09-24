import * as crypto from "crypto";

import Debug from "debug";
import cloneDeep from "lodash.clonedeep";
import slug from "slug";

import {
    FullItem,
    FullItemAllOfFields,
    FullItemAllOfSections,
    GeneratorRecipe,
    ItemUrls,
    ItemVault,
} from "../model/models";

const debug = Debug("opconnect:builder");

export interface ItemFieldOptions {
    value?: string;
    type?: FullItemAllOfFields.TypeEnum;
    sectionName?: string;
    purpose?: FullItemAllOfFields.PurposeEnum;
    label?: string;
    generate?: boolean;
    recipe?: GeneratorRecipe;
}

export class ItemBuilder {
    /**
     * Empty Item under construction.
     *
     * @private
     */
    private item: FullItem;

    /**
     * Hashmap to support get-or-create operations on "sections" when adding fields
     *
     * @private
     */
    private sections: Map<string, FullItemAllOfSections>;
    private urls: { [key: string]: any };

    public constructor() {
        this.reset();
    }

    /**
     * Performs final assembly of the new Item.
     */
    public build(): FullItem {
        if (!this.item.category) {
            throw Error("Item Category is required.");
        }

        this.item.sections = Array.from(this.sections.values());

        this.item.urls = this.urls.hrefs.map((href) =>
            this.urls.primaryUrl === href
                ? ({ primary: true, href } as ItemUrls)
                : ({ href } as ItemUrls),
        );
        const builtItem = cloneDeep(this.item);
        debug(
            "Successfully built Item (id: %s, vault: %s)",
            builtItem.id,
        );
        this.reset();
        return builtItem;
    }

    /**
     * Clears accumulated properties and puts
     * ItemBuilder back to a "pristine" state
     */
    public reset(): void {
        this.item = new FullItem();
        this.item.fields = [];
        this.item.tags = [];

        this.sections = new Map();
        this.urls = { primaryUrl: "", hrefs: [] };
    }

    /**
     * @deprecated
     * Sets the parent Vault ID for the Item being constructed.
     *
     * @param {string} vaultId
     * @returns {ItemBuilder}
     */
     public setVault(vaultId: string): ItemBuilder {
        this.item.vault = { id: vaultId } as ItemVault;
        return this;
    }

    /**
     * Set Title for the item under construction
     *
     * @param {string} title
     * @returns {ItemBuilder}
     */
    public setTitle(title: string): ItemBuilder {
        this.item.title = title;
        return this;
    }

    /**
     * Append new tag to list of tags
     * 1Password does not normalize tag inputs.
     *
     * @param {string} tag
     * @returns {ItemBuilder}
     */
    public addTag(tag: string): ItemBuilder {
        this.item.tags.push(tag);
        return this;
    }

    /**
     * Append new Item Field to the in-flight Item.
     *
     * @param {ItemFieldOptions} opts
     * @returns {ItemBuilder}
     */
    public addField(opts: ItemFieldOptions = {}): ItemBuilder {
        const field: FullItemAllOfFields = {
            type: opts.type || FullItemAllOfFields.TypeEnum.String,
            purpose: opts.purpose || FullItemAllOfFields.PurposeEnum.Empty,
            label: opts.label,
            value: opts.value,
            generate: opts.generate || false,
            recipe: opts.generate ? opts.recipe : undefined,
        };

        if (opts.sectionName) {
            const { id: sectionId } = this.getOrCreateSection(opts.sectionName);
            field.section = { id: sectionId };
        }

        if (opts.generate && !validRecipe(opts.recipe)) {
            throw TypeError(
                `Field '${opts.label}' contains an invalid Recipe.`,
            );
        }

        this.item.fields.push(field);
        return this;
    }

    /**
     * Define a new section within the Item.
     *
     * If a section with the same (normalized) name
     * already exists, do nothing.
     *
     * @param sectionName
     * @returns {ItemBuilder}
     */
    public addSection(sectionName: string): ItemBuilder {
        this.getOrCreateSection(sectionName);
        return this;
    }

    /**
     * Toggle `favorite` value on the in-flight Item.
     *
     * @returns {ItemBuilder}
     */
    public toggleFavorite(): ItemBuilder {
        this.item.favorite = !this.item.favorite;
        return this;
    }

    /**
     * Add a new URL to the Item.
     *
     * The **last** url marked `primary` will be the primary URL
     * when saved to 1Password.
     *
     * @param url
     * @returns {ItemBuilder}
     */
    public addUrl(url: ItemUrls): ItemBuilder {
        if (url.primary) this.urls.primaryUrl = url.href;
        this.urls.hrefs.push(url.href);
        return this;
    }

    /**
     * Assign category to the Item under construction.
     *
     * @param category
     * @returns {ItemBuilder}
     */
    public setCategory(category: FullItem.CategoryEnum | string): ItemBuilder {
        if (Object.values(FullItem.CategoryEnum).indexOf(category) === -1) {
            throw TypeError("Item Category is invalid");
        }
        this.item.category = category as FullItem.CategoryEnum;
        return this;
    }
    
    /**
     * Creates a new Item Section if it does not exist. Otherwise, return the previously-created
     * Item Section.
     *
     * Normalizes sectionName as a slug (utf-8 chars are transformed to ascii).
     *
     * @param sectionName
     * @private
     * @return {FullItemAllOfSections}
     */
    private getOrCreateSection(sectionName: string): FullItemAllOfSections {
        const normalizedName = slug(sectionName, { lower: true });

        if (this.sections.has(normalizedName)) {
            return this.sections.get(normalizedName);
        }

        // Note about Section IDs: these do NOT have to be cryptographically random.
        // Section IDs are only unique within an Item.
        const section: FullItemAllOfSections = {
            id: generateSectionId(),
            label: sectionName,
        };
        this.sections.set(normalizedName, section);
        return section;
    }
}

/**
 * Evaluate Recipe parameters against allowed values.
 *
 * @param {GeneratorRecipe} recipe
 * @returns {boolean}
 */
const validRecipe = (recipe: GeneratorRecipe): boolean => {
    recipe.characterSets = [...new Set(recipe.characterSets)];
    if (!recipe.characterSets || !recipe.characterSets.length) return true;

    const allowedCharactersSets = Object.values(
        GeneratorRecipe.CharacterSetsEnum,
    );

    // User provided more character sets than are defined
    if (recipe.characterSets.length > allowedCharactersSets.length) return false;

    for (const cs of recipe.characterSets) {
        if (allowedCharactersSets.indexOf(cs) === -1) {
            return false;
        }
    }
    return true;
};

/**
 * Create a sectionID from random bytes.
 *
 * Section IDs do not need to be cryptographically random.
 *
 * @param {number} length
 * @returns {string}
 */
const generateSectionId = (length?: number): string =>
    crypto.randomBytes(length || 13).toString("hex");
