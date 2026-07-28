class AddSoftDeleteAndDefaultFlagToCategories  < ActiveRecord::Migration[7.2]
  def change
    add_column :categories, :is_default, :boolean, default: true, null: false
    add_column :categories, :deleted_at, :datetime
    add_index :categories, :deleted_at
  end
end
