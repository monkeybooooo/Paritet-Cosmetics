import type { Schema, Struct } from '@strapi/strapi';

export interface ProductItem extends Struct.ComponentSchema {
  collectionName: 'components_product_items';
  info: {
    displayName: 'item';
  };
  attributes: {};
}

export interface ProductVariants extends Struct.ComponentSchema {
  collectionName: 'components_product_variants';
  info: {
    displayName: 'variants';
  };
  attributes: {
    is_dispenser_system: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    package_label: Schema.Attribute.String;
    product_shots: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    unit: Schema.Attribute.Enumeration<['ml', 'ml ', 'g', 'l']> &
      Schema.Attribute.Required;
    value: Schema.Attribute.Integer & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'product.item': ProductItem;
      'product.variants': ProductVariants;
    }
  }
}
