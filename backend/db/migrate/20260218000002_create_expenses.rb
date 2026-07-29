class CreateExpenses < ActiveRecord::Migration[7.2]
  def change
    create_table :expenses, if_not_exists: true do |t|
      t.string :description, null: false, limit: 255
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.date :date, null: false
      t.references :category, null: false, foreign_key: true, index: true

      t.timestamps
    end
  end
end
