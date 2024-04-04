const express = require("express");
const db = require("../../db");
const Subcategory = require("../models/subcategoryModel");

module.exports = class Category {
	// Inquiry Categori Layanan
	async getAllCategorySubcategory() {
		let SPGetCategories = `
    select category.category_id as id, category.name as name, category.image as image_url, 
        COALESCE(
            (SELECT COUNT(service.subcategory_id) 
             FROM service
             JOIN subcategory ON service.subcategory_id = subcategory.subcategory_id
             WHERE category_id = category.category_id
             GROUP BY subcategory.category_id), 0) AS service_amount,
        jsonb_agg(
                json_build_object(
                    'id', subcategory.subcategory_id,
                    'name', subcategory.name
                )
            ) AS sub_categories
        from 
          category
        inner join 
          subcategory on subcategory.category_id = category.category_id
        GROUP BY
            category.category_id, category.name, category.image
      ORDER BY id asc`;

		try {
			let result = await db.any(SPGetCategories);

			return result;
		} catch (error) {
			return new Error("Gagal Mendapatkan Data.");
		}
	}

	// Inquiry Category Tugas
	async getAllCategorySubcategoryTask() {
		let SP = `
    select 
    c.category_id as id,
    c.name as name,
    c.image as image_url,
    (
      select count(*) 
      from 
      public.task
      where 
      sub_category_id in
      (
        select (subcategory_id)
        from
        public.subcategory
        where
        category_id = c.category_id
      )
    ) as task_amount,
    (
      select json_agg(t)
      from 
      (
        select subcategory_id as id, name
        from public.subcategory
        where
        category_id = c.category_id
      ) t
    ) as sub_categories
    from
    public.category c
    `;

		try {
			let result = db.any(SP);

			return result;
		} catch (error) {
			return new Error("Error Get Data.");
		}
	}
};
