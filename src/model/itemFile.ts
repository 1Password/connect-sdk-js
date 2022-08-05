import { FullItemAllOfSection } from "./fullItemAllOfSection";

export class ItemFile {
    'id'?: string;
    'name'?: string;
    'size': number;
    'content_path'?: string;
    'content'?: string;
    'section'?: FullItemAllOfSection;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string",
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "size",
            "baseName": "size",
            "type": "number"
        },
        {
            "name": "content_path",
            "baseName": "content_path",
            "type": "string"
        },
        {
            "name": "content",
            "baseName": "content",
            "type": "string"
        },
        {
            "name": "section",
            "baseName": "section",
            "type": "FullItemAllOfSection"
        }    ];

    static getAttributeTypeMap() {
        return ItemFile.attributeTypeMap;
    }
}
