package db

import (
	"encoding/json"
	"fmt"
	"path"
	"waiter/backend/filesystem"

	"github.com/nutsdb/nutsdb"
)

const (
	settingBucketName = "settingsBucket"

	recentlyOpenedFilesKey = "recentlyOpenedFiles"
)

var (
	dbPath = path.Join(filesystem.GetAppDataFolder(), "waiter.db")
)

type Database struct {
	db *nutsdb.DB
}

func NewDatabase() (*Database, error) {
	opt := nutsdb.DefaultOptions
	opt.Dir = dbPath

	db, err := nutsdb.Open(opt)
	if err != nil {
		return nil, err
	}

	// Initialize buckets
	db.Update(func(tx *nutsdb.Tx) error {
		tx.Put(settingBucketName, []byte("init"), []byte("true"), 0)
		return nil
	})

	return &Database{db: db}, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

func (d *Database) GetSetting(Name string) (string, error) {
	result := ""
	key := []byte(Name)

	if err := d.db.View(
		func(tx *nutsdb.Tx) error {
			bytes, err := tx.Get(settingBucketName, key)
			if err != nil {
				if err == nutsdb.ErrKeyNotFound {
					return nil
				}
				return err
			}

			result = string(bytes.Value)

			return err
		}); err != nil {
		return "", err
	}

	return result, nil
}

func (d *Database) SetSetting(Name string, Value string) error {
	key := []byte(Name)
	value := []byte(Value)

	if err := d.db.Update(
		func(tx *nutsdb.Tx) error {
			return tx.Put(settingBucketName, key, value, 0)
		}); err != nil {
		return err
	}

	return nil
}

func (d *Database) GetRecentlyOpenedFiles() ([]string, error) {
	result := make([]string, 0)

	encodedSetting, err := d.GetSetting(recentlyOpenedFilesKey)
	if err != nil {
		return nil, fmt.Errorf("error getting recently opened files: %w", err)
	}
	if (encodedSetting == "") || (encodedSetting == "null") {
		return result, nil
	}

	if err := json.Unmarshal([]byte(encodedSetting), &result); err != nil {
		return nil, fmt.Errorf("error unmarshalling recently opened files: %w", err)
	}
	return result, nil
}

func (d *Database) AddRecentlyOpenedFile(FileName string) error {
	recentlyOpenedFiles, err := d.GetRecentlyOpenedFiles()
	if err != nil {
		return fmt.Errorf("error getting recently opened files: %w", err)
	}

	// Remove duplicates
	for i := 0; i < len(recentlyOpenedFiles); i++ {
		if recentlyOpenedFiles[i] == FileName {
			recentlyOpenedFiles = append(recentlyOpenedFiles[:i], recentlyOpenedFiles[i+1:]...)
			i--
		}
	}

	recentlyOpenedFiles = append([]string{FileName}, recentlyOpenedFiles...)

	encodedSetting, err := json.Marshal(recentlyOpenedFiles)
	if err != nil {
		return fmt.Errorf("error marshalling recently opened files: %w", err)
	}

	if err := d.SetSetting(recentlyOpenedFilesKey, string(encodedSetting)); err != nil {
		return fmt.Errorf("error setting recently opened files: %w", err)
	}

	return nil
}

func (d *Database) ClearRecentlyOpenedFiles() error {
	if err := d.SetSetting(recentlyOpenedFilesKey, "[]"); err != nil {
		return fmt.Errorf("error clearing recently opened files: %w", err)
	}

	return nil
}
