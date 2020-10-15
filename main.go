package main

import (
	"encoding/json"
	"errors"
	"flag"
	"net/http"
	"os"
	"reflect"

	"github.com/unixpickle/essentials"
	"github.com/unixpickle/pecunia/pecunia"
)

type Server struct {
	Storage pecunia.Storage
}

func main() {
	var addr string
	var assets string
	var dataDir string
	flag.StringVar(&addr, "addr", ":8080", "address to listen on")
	flag.StringVar(&assets, "assets", "./assets", "asset directory")
	flag.StringVar(&dataDir, "data-dir", "pecunia_data", "directory to store data")
	flag.Parse()

	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		essentials.Must(os.Mkdir(dataDir, 0755))
	}

	server := &Server{Storage: &pecunia.DirStorage{Dir: dataDir}}
	fs := http.FileServer(http.Dir(assets))
	http.Handle("/", fs)
	http.HandleFunc("/accounts", server.ServeAccounts)
	http.HandleFunc("/add_account", server.ServeAddAccount)
	http.HandleFunc("/delete_account", server.ServeDeleteAccount)
	http.HandleFunc("/transactions", server.ServeTransactions)
	http.HandleFunc("/upload_transactions", server.ServeUploadTransactions)
	http.HandleFunc("/account_filters", server.ServeAccountFilters)
	http.HandleFunc("/set_account_filters", server.ServeSetAccountFilters)

	essentials.Must(http.ListenAndServe(addr, nil))
}

func (s *Server) ServeAccounts(w http.ResponseWriter, r *http.Request) {
	accounts, err := s.Storage.Accounts()
	if err != nil {
		s.serveError(w, err, http.StatusInternalServerError)
		return
	}
	s.serveObject(w, accounts)
}

func (s *Server) ServeAddAccount(w http.ResponseWriter, r *http.Request) {
	name := r.FormValue("name")
	importer := r.FormValue("importer")
	if name == "" {
		s.serveError(w, errors.New("name is empty"), http.StatusBadRequest)
		return
	}
	if _, err := pecunia.ImporterForID(importer); err != nil {
		s.serveError(w, err, http.StatusBadRequest)
		return
	}
	if account, err := s.Storage.AddAccount(name, importer); err != nil {
		s.serveError(w, err, http.StatusInternalServerError)
	} else {
		s.serveObject(w, account)
	}
}

func (s *Server) ServeDeleteAccount(w http.ResponseWriter, r *http.Request) {
	accountID := r.FormValue("account_id")
	if err := s.Storage.DeleteAccount(accountID); err != nil {
		s.serveError(w, err, http.StatusInternalServerError)
	} else {
		s.serveObject(w, "ok")
	}
}

func (s *Server) ServeTransactions(w http.ResponseWriter, r *http.Request) {
	accountID := r.FormValue("account_id")
	if trans, err := s.Storage.Transactions(accountID); err != nil {
		s.serveError(w, err, http.StatusInternalServerError)
	} else {
		s.serveObject(w, trans)
	}
}

func (s *Server) ServeUploadTransactions(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(2000000)

	accountID := r.FormValue("account_id")
	account, err := pecunia.AccountForID(s.Storage, accountID)
	if err != nil {
		s.serveError(w, err, http.StatusBadRequest)
		return
	}
	importer, err := pecunia.ImporterForID(account.ImporterID)
	if err != nil {
		s.serveError(w, err, http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("document")
	if err != nil {
		s.serveError(w, err, http.StatusBadRequest)
		return
	}
	defer file.Close()

	existing, err := s.Storage.Transactions(accountID)
	if err != nil {
		s.serveError(w, err, http.StatusInternalServerError)
		return
	}

	trans, err := importer.Merge(file, existing)
	if err != nil {
		s.serveError(w, err, http.StatusBadRequest)
		return
	}
	if err := s.Storage.SetTransactions(accountID, trans); err != nil {
		s.serveError(w, err, http.StatusInternalServerError)
		return
	}
	s.serveObject(w, trans)
}

func (s *Server) ServeAccountFilters(w http.ResponseWriter, r *http.Request) {
	accountID := r.FormValue("account_id")
	if filters, err := s.Storage.AccountFilters(accountID); err != nil {
		s.serveError(w, err, http.StatusInternalServerError)
	} else {
		s.serveObject(w, filters)
	}
}

func (s *Server) ServeSetAccountFilters(w http.ResponseWriter, r *http.Request) {
	accountID := r.FormValue("account_id")
	filterJSON := r.FormValue("filters")

	var filters pecunia.MultiFilter
	if err := json.Unmarshal([]byte(filterJSON), &filters); err != nil {
		s.serveError(w, err, http.StatusBadRequest)
		return
	}
	if err := s.Storage.SetAccountFilters(accountID, &filters); err != nil {
		s.serveError(w, err, http.StatusInternalServerError)
		return
	}
	s.serveObject(w, &filters)
}

func (s *Server) serveError(w http.ResponseWriter, err error, status int) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":  err.Error(),
		"status": status,
		"result": nil,
	})
}

func (s *Server) serveObject(w http.ResponseWriter, obj interface{}) {
	value := reflect.ValueOf(obj)
	if value.Type().Kind() == reflect.Slice {
		if value.Len() == 0 {
			// Prevent null values in JSON object.
			obj = []interface{}{}
		}
	}
	w.Header().Set("content-type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":  nil,
		"status": http.StatusOK,
		"result": obj,
	})
}
