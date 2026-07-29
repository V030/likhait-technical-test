class Api::CategoriesController < ApplicationController
  def index
    categories = Category.order(:name)
    render json: categories
  end

  def create
    category = Category.new(category_params)
    if category.save
      render json: category, status: :created
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    category = Category.find(params[:id])
    if category.is_default && category_params.key?(:name) && category_params[:name] != category.name
      return render json: { errors: [ "Cannot rename a default category" ] }, status: :unprocessable_entity
    end
    if category.update(category_params)
      render json: category
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    category = Category.find(params[:id])
    if category.is_default
      return render json: { errors: [ "Cannot delete a default category" ] }, status: :unprocessable_entity
    end
    category.destroy
    head :no_content
  end

  private

  def category_params
    params.require(:category).permit(:name, :icon)
  end
end
