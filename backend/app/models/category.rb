class Category < ApplicationRecord
  has_many :expenses, dependent: :destroy
  attribute :is_default, default: false
end
