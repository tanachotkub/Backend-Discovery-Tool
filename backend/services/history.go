package services

import (
	"backend-discovery/models"

	"gorm.io/gorm"
)

type HistoryService struct {
	DB *gorm.DB
}

type HistoryFilter struct {
	Page    int
	PerPage int
	Status  string // "success" | "error" | ""
}

type HistoryResponse struct {
	Data       []models.ScanHistory `json:"data"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	PerPage    int                  `json:"per_page"`
	TotalPages int                  `json:"total_pages"`
}

func (s HistoryService) GetAll(filter HistoryFilter) (HistoryResponse, error) {
	var histories []models.ScanHistory
	var total int64

	query := s.DB.Model(&models.ScanHistory{})

	// Filter by status ถ้ามี
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	query.Count(&total)

	// Pagination
	offset := (filter.Page - 1) * filter.PerPage
	if err := query.
		Order("created_at DESC").
		Limit(filter.PerPage).
		Offset(offset).
		Find(&histories).Error; err != nil {
		return HistoryResponse{}, err
	}

	totalPages := int(total) / filter.PerPage
	if int(total)%filter.PerPage != 0 {
		totalPages++
	}

	return HistoryResponse{
		Data:       histories,
		Total:      total,
		Page:       filter.Page,
		PerPage:    filter.PerPage,
		TotalPages: totalPages,
	}, nil
}

func (s HistoryService) GetByID(id uint) (models.ScanHistory, error) {
	var history models.ScanHistory
	if err := s.DB.First(&history, id).Error; err != nil {
		return models.ScanHistory{}, err
	}
	return history, nil
}

func (s HistoryService) DeleteByID(id uint) error {
	return s.DB.Delete(&models.ScanHistory{}, id).Error
}
