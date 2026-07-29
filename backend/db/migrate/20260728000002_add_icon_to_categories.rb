class AddIconToCategories  < ActiveRecord::Migration[7.2]
  def change
    add_column :categories, :icon, :string, limit: 100
  end
end
