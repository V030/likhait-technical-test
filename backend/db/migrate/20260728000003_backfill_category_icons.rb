class BackfillCategoryIcons < ActiveRecord::Migration[7.2]
  def up
    icons = {
      'Food' => 'ForkKnife',
      'Transportation' => 'Car',
      'Shopping' => 'ShoppingBag',
      'Entertainment' => 'FilmStrip',
      'Bills' => 'Receipt',
      'Healthcare' => 'Heart',
      'Education' => 'GraduationCap',
      'Travel' => 'Airplane',
      'Personal' => 'User',
      'Other' => 'Package'
    }

    icons.each do |name, icon|
      Category.where(name: name, is_default: true).update_all(icon: icon)
    end
  end

  def down
    Category.where(is_default: true).update_all(icon: nil)
  end
end
