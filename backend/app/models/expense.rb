class Expense < ApplicationRecord
  belongs_to :category
  validate :date_not_in_future

  private

  def date_not_in_future
    if date.present? && date > Date.current
      errors.add(:date, "Date must be today or earlier.")
    end
  end
end
