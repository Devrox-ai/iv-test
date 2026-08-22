const { ObjectId } = require("mongodb");

const catalog = [
  {
    "category": "Sarees",
    "title": "Hot Pink Organza Saree With Stone And Cut Dana Work",
    "price": 2499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/hot-pink-organza-saree-with-stone-and-cut-dana-work-sg317716-1(1).jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Sarees",
    "title": "Sg261617 Blue Organza Parsi Gara Embroidered Saree 6",
    "price": 2999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/sg261617-blue_organza_parsi_gara_embroidered_saree_6(1).jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Sarees",
    "title": "Red Silk Bandhani Palazzo Suit With",
    "price": 3499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/red_silk_bandhani_palazzo_suit_with-sg343950-6_5.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Sarees",
    "title": "Rani Pink Banarasi Bandhani Satin Saree With Brocader",
    "price": 3999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/rani_pink_banarasi_bandhani_satin_saree_with_brocader-sg255149_2_099732c5-0a5f-415f-a0cd-5038dc8ab1df.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Teal Anarkali Set With Zardosi Work",
    "price": 4499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/teal-anarkali-set-with-zardosi-work-sg381510-3_a3ac3a51-33d6-4d08-9b47-62b222aa81ca.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Olive Linen Kurta Set For Men With Resham Embroidery",
    "price": 1999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/olive-linen-kurta-set-for-men-with-resham-embroidery-sg321692-4.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Purple Pakistani Style Sharara Set With Dupatta",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/purple-pakistani-style-sharara-set-with-dupatta-sg382063-3_cd4678ea-f8de-46ed-a51f-cdb40ff32bab.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Red Silk Bandhani Palazzo Suit With",
    "price": 3299,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/red_silk_bandhani_palazzo_suit_with-sg343950-6_1.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Festive",
    "title": "Pink Zardosi Kurta Pant Set With Dupatta",
    "price": 2499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/pink-zardosi-kurta-pant-set-with-dupatta-sg382049-2_532300fc-87de-4c1d-aa51-283683b63c08.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Festive",
    "title": "Yellow Embroidered Silk Kurta Set",
    "price": 2999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/yellow-embroidered-silk-kurta-set-sg364109-3_e83cf83d-90c5-497b-aaf1-c4b3db9850db.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Festive",
    "title": "Green Indo Western Drape Skirt Set With Cut Dana And Beads Work Cape",
    "price": 3499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/green-indo-western-drape-skirt-set-with-cut-dana-and-beads-work-cape-sg394763-1_fb5bf2a1-0a1b-416b-bba1-79197802b391.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Men",
    "title": "Pink Jacquard Kurta Set For Men",
    "price": 3999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/pink-jacquard-kurta-set-for-men-sg322452-5.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Men",
    "title": "Pink Zardosi And Moti Work Kurta Palazzo Set With Dupatta",
    "price": 4499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/pink-zardosi-and-moti-work-kurta-palazzo-set-with-dupatta-sg382028-6_fdcec436-13ba-4f98-8039-323bd152e630.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Indo Western",
    "title": "Blue Cape Style Crop Top Drape Skirt Set",
    "price": 1999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/blue-cape-style-crop-top-drape-skirt-set-sg388087-4_f8bbd9b3-0fd0-4c07-94f3-64438fe62867.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Indo Western",
    "title": "Blue Cape Style Crop Top Drape Skirt Set",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/blue-cape-style-crop-top-drape-skirt-set-sg388087-5_2c19035f-44c9-43ea-827c-49d6bba0f45e.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Sg350720 3",
    "price": 3299,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/sg350720-3_8888ac03-b9c8-4ca0-8ff9-5519cfb32f3b(1).jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Brownish Grey Tissue Silk Saree With Zari Border",
    "price": 2499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/brownish_grey_tissue_silk_saree_with_zari_border-sg276469_10.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Green Khaddi Georgette Bandhani Saree With",
    "price": 2999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/green_khaddi_georgette_bandhani_saree_with-sg208223_2.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Off White Saree In Natural Traditional Prints",
    "price": 3499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/off-white-saree-in-natural-traditional-prints-sg311933-2.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Sg182289",
    "price": 3999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/sg182289_1.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Blue Organza Striped Saree With Mirror Work And Unstitched B",
    "price": 4499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/blue_organza_striped_saree_with_mirror_work_and_unstitched_b-sg182289_4.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Grey Gotta Lace Tissue Anarkali Suit Set With Pant And Dupatta",
    "price": 1999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/grey-gotta-lace-tissue-anarkali-suit-set-with-pant-and-dupatta-sg341085-4_73994421-4607-4380-898b-eec580196ed1.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Mustard Yellow Kurta Set With Sequin Detail",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/mustard-yellow-kurta-set-with-sequin-detail-sg371575-2_08868209-ebfd-4437-b02c-b74e1b7e0129.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Hot Pink Woven Khadi Georgette Saree With Uns",
    "price": 3299,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/hot_pink_woven_khadi_georgette_saree_with_uns-sg208222_11_b1ebe2e0-c214-4eb6-88fc-7b7bcce04027.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Blue Organza Striped Saree With Mirror Work And Unstitched B",
    "price": 2499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/blue_organza_striped_saree_with_mirror_work_and_unstitched_b-sg182289_11.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Hot Pink Organza Saree With Stone And Cut Dana Work",
    "price": 2999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/hot-pink-organza-saree-with-stone-and-cut-dana-work-sg317716-9.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Blue Organza Parsi Gara Embroidered Saree",
    "price": 3499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/blue-organza-parsi-gara-embroidered-saree-sg261617-12_5dbabb69-ac43-47e0-a53f-3b440bf8e810.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Purple Hand Embroidered Kurta And Pant Set In Linen",
    "price": 3999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/purple_hand_embroidered_kurta_and_pant_set_in_linen-sg273208_7(1).jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Yellow Zardosi And Moti Cape Set With Palazzo",
    "price": 4499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/yellow-zardosi-and-moti-cape-set-with-palazzo-sg382239-1_02693a6f-27b9-4841-8ca7-bcebc0a01fc3.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Sg261617 Blue Organza Parsi Gara Embroidered Saree 3",
    "price": 1999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/sg261617-blue_organza_parsi_gara_embroidered_saree_3_ca55c925-92e4-46bb-b001-15a16391acfb(1).jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  }
];


// Additional unique product styles detected in the existing public/images catalog.
// These are one representative image per product code; repeated angle/detail images
// are intentionally not duplicated as separate products.
const extraCatalog = [
  {
    "category": "Sarees",
    "title": "Green Floral Printed",
    "price": 2999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/green_floral_printed-sg177306_5.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Sarees",
    "title": "Sg214161 4",
    "price": 2999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/sg214161_4.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Men",
    "title": "Black Kurta Set With Zipper Closure",
    "price": 2499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/black_kurta_set_with_zipper_closure-sg245001_4.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Men",
    "title": "Navy Blue Thread Hand Embroidered Kurta Set",
    "price": 2499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/navy_blue_thread_hand_embroidered_kurta_set-sg259143_6_c0ce8566-3c84-4961-94ea-863a18c65e1e.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Sky Blue Floral Hand Embroidered Kurta And Pant Set",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/sky_blue_floral_hand_embroidered_kurta_and_pant_set-sg273216_2.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Light Natural Floral Resham Embroidered Kurta And Pant Set",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/light_natural_floral_resham_embroidered_kurta_and_pant_set-sg273224_1.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Sky Blue Kurta Set With Floral",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/sky_blue_kurta_set_with_floral-sg273240_6(1).jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Green Silk Kurta Set With Printed Artwork",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/green-silk-kurta-set-with-printed-artwork-sg309153-6.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Grey Art Silk Kurta Set",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/grey-art-silk-kurta-set-sg321459-6_ad01d6c7-3d56-4c62-8018-3a9497654de4.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Women Ethnic",
    "title": "Pista Green Gotta Lace Tissue Anarkali Suit Set With Pant And Dupatta",
    "price": 2799,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/pista-green-gotta-lace-tissue-anarkali-suit-set-with-pant-and-dupatta-sg341097-2_9f870534-b06c-4712-b68b-e7c50a53299d(1).jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Sarees",
    "title": "Red Satin Woven Saree With Zari Work",
    "price": 2999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/red-satin-woven-saree-with-zari-work-sg350502-7.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Sarees",
    "title": "Mauve Net Embellished Saree With Sequins Blouse",
    "price": 2999,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/mauve-net-embellished-saree-with-sequins-blouse-sg353792-1_855b5727-9029-46d4-9edd-8ab75ae10108.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Festive",
    "title": "Magenta Zardosi Threadwork Kurta Palazzo Set With Dupatta",
    "price": 3499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/magenta-zardosi-threadwork-kurta-palazzo-set-with-dupatta-sg381937-3_6b8de9a0-9f37-4a6d-ad85-ae93a4ae76d3.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Festive",
    "title": "Green Zardosi Threadwork Kurta Palazzo Set With Dupatta",
    "price": 3499,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/green-zardosi-threadwork-kurta-palazzo-set-with-dupatta-sg381951-3_cafe554f-1205-4229-ad24-f4c2d53ad11d(1).jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  },
  {
    "category": "Indo Western",
    "title": "Peacock Blue Kaftan Top Palazzo Set",
    "price": 3299,
    "image": "Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/peacock-blue-kaftan-top-palazzo-set-sg382281-6_68973e29-dd77-4a79-97a3-14eac62c0bd0.jpg",
    "stock": 12,
    "lowStockLimit": 3,
    "active": true
  }
];
catalog.push(...extraCatalog);

function defaultSizesForCategory(category) {
    const name = String(category || "").toLowerCase();
    // Sarees are normally sold as free-size; stitched garments get apparel sizes.
    if (name.includes("saree")) {
        return { "Free Size": 12 };
    }
    if (name === "men") {
        return { S: 3, M: 3, L: 3, XL: 2, XXL: 1, "3XL": 1 };
    }
    return { XS: 1, S: 3, M: 3, L: 3, XL: 2, XXL: 1 };
}

async function seedCatalog(db) {
    const categoryCollection = db.collection("categories");
    const productCollection = db.collection("products");

    const categoryIds = {};

    for (const item of catalog) {
        let category = await categoryCollection.findOne({ name: item.category });

        if (!category) {
            const result = await categoryCollection.insertOne({
                name: item.category,
                image: item.image,
                createdAt: new Date()
            });
            category = { _id: result.insertedId, name: item.category };
        }

        categoryIds[item.category] = category._id;
    }

    let added = 0;
    let skipped = 0;

    for (const item of catalog) {
        const exists = await productCollection.findOne({ image: item.image });

        if (exists) {
            // Upgrade older seeded products without changing their price/image.
            if (!Array.isArray(exists.sizes) || !exists.sizes.length) {
                const sizeStock = defaultSizesForCategory(item.category);
                await productCollection.updateOne(
                    { _id: exists._id },
                    { $set: { sizes: Object.keys(sizeStock), sizeStock } }
                );
            }
            skipped++;
            continue;
        }

        await productCollection.insertOne({
            title: item.title,
            price: item.price,
            image: item.image,
            categoryId: categoryIds[item.category],
            stock: item.stock,
            lowStockLimit: item.lowStockLimit,
            sizes: Object.keys(defaultSizesForCategory(item.category)),
            sizeStock: defaultSizesForCategory(item.category),
            active: true,
            createdAt: new Date()
        });

        added++;
    }

    return { added, skipped, total: catalog.length };
}

module.exports = { seedCatalog };
