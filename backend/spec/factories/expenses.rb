FactoryBot.define do
  factory :expense do
    description { Faker::Commerce.product_name }
    amount { rand(1.0..500.0).round(2) }
    date { Faker::Date.backward(days: 30) }
    category
  end
end
