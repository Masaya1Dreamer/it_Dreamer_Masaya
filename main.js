/* jshint curly:true, debug:true */
/* globals $, firebase, location */

/**
 * すべての画面共通で使う関数
 */

// ビュー（画面）を変更する
function showView(id) {
  $(".view").hide();
  $("#" + id).fadeIn();

  if (id === "bookshelf") {
    loadBookshelfView();
  }
}

/*////google api//////*/
function bookSearch(){
  var search = document.getElementById('search').value
  document.getElementById('results').innerHTML = ""
  console.log(search)

  $.ajax({
    url: "https://www.googleapis.com/books/v1/volumes?q=" + search,
    datatype: "json",

    success: function(data) {
      for(i = 0; i < data.items.length; i++){
        results.innerHTML += "<h2>" + data.items[i].volumeInfo.title + "</h2>"
      }
    },
    
    type: 'GET'
  });
}

document.getElementById('button').addEventListener('click', bookSearch, false)

/**
 * ログイン・ログアウト関連の関数
 */

// ログインフォームを初期状態に戻す
function resetLoginForm() {
  $(".login__help").hide();
  $(".login__submit-button")
    .removeAttr("disabled")
    .text("ログイン");
}

// 書籍の登録モーダルを閉じて、初期状態に戻す
function resetAddBookModal() {
  $("#addBookModal").modal("hide");
  $("#book-form")[0].reset();
  $("#submit_add_book")
    .removeAttr("disabled")
    .text("保存する");
}

// ログインした直後に呼ばれる
function onLogin() {
  console.log("ログイン完了");

  // 書籍一覧画面を表示
  showView("bookshelf");
}

// ログアウトした直後に呼ばれる
function onLogout() {
  var booksRef = firebase.database().ref("books");

  // 過去に登録したイベントハンドラを削除
  booksRef.off("child_removed");
  booksRef.off("child_added");

  resetLoginForm();
  resetAddBookModal();
  showView("login");
}

/**
 * 書籍一覧画面関連の関数
 */

// 書籍一覧画面の初期化、イベントハンドラ登録処理
function loadBookshelfView() {
  resetBookshelfView();

  // 書籍データを取得
  var booksRef = firebase
    .database()
    .ref("books")
    .orderByChild("createdAt");

  // 過去に登録したイベントハンドラを削除
  booksRef.off("child_removed");
  booksRef.off("child_added");

  // books の child_removedイベントハンドラを登録
  // （データベースから書籍が削除されたときの処理）
  booksRef.on("child_removed", function(favSnapshot) {
    var bookId = favSnapshot.key;

    // TODO: 書籍一覧画面から該当の書籍データを削除する
  $book.remove();
  });

  // books の child_addedイベントハンドラを登録
  // （データベースに書籍が追加保存されたときの処理）
  booksRef.on("child_added", function(favSnapshot) {
    var bookId = favSnapshot.key;
    var bookData = favSnapshot.val();

    // 書籍一覧画面に書籍データを表示する
    addBook(bookId, bookData);
  });
}

// 書籍一覧画面内の書籍データをクリア
function resetBookshelfView() {
  $("#book-list").empty();
}

// 書籍一覧画面に書籍データを表示する
function addBook(bookId, bookData) {
  var $divTag = createBookDiv(bookId, bookData);
  $divTag.appendTo("#book-list");
}

// 書籍の表示用のdiv（jQueryオブジェクト）を作って返す
function createBookDiv(bookId, bookData) {
  // HTML内のテンプレートからコピーを作成する
  var $divTag = $("#book-template > .book-item").clone();

  // 書籍タイトルを表示する
  $divTag.find(".book-item__title").text(bookData.bookTitle);

  // 書籍の表紙画像をダウンロードして表示する
  downloadBookImage(bookData.bookImageLocation).then(function(url) {
    displayBookImage($divTag, url);
  });

  // id属性をセット
  $divTag.attr("id", "book-id-" + bookId);

  // 削除ボタンのイベントハンドラを登録
  var $deleteButton = $divTag.find(".book-item__delete");
  $deleteButton.click(function() {
    deleteBook(bookId);
  });

  return $divTag;
}

// 書籍の表紙画像をダウンロードする
function downloadBookImage(bookImageLocation) {
  // book-images/abcdef のようなパスから画像のダウンロードURLを取得
  return firebase
    .storage()
    .ref(bookImageLocation)
    .getDownloadURL()
    .catch(function(error) {
      console.error("写真のダウンロードに失敗:", error);
    });
}

// 書籍の表紙画像を表示する
function displayBookImage($divTag, url) {
  $divTag.find(".book-item__image").attr({
    src: url
  });
}

// Realtime Database の books から書籍を削除する
const deleteBook = (bookId) => {
  // TODO: books から該当の書籍データを削除
 firebase
 .database()
 .ref('books')
 .child(bookId)
 .remove()
}

$(document).ready(function() {
  // ログイン状態の変化を監視する
  firebase.auth().onAuthStateChanged(function(user) {
    // ログイン状態が変化した
    if (user) {
      // ログイン済
      onLogin();
    } else {
      // 未ログイン
      onLogout();
    }
  });

  // ログインフォームが送信されたらログインする
  $("#login-form").submit(function() {
    // フォームを初期状態に戻す
    resetLoginForm();

    // ログインボタンを押せないようにする
    $(".login__submit-button")
      .attr("disabled", "disabled")
      .text("送信中…");

    var email = $("#login-email").val();
    var password = $("#login-password").val();

    // ログインを試みる
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(function() {
        // ログインに成功したときの処理
        console.log("ログインしました。");
      })
      .catch(function(error) {
        // ログインに失敗したときの処理
        $("#login .help-block").text("ログインに失敗しました。");
        console.error("ログインエラー", error);

        // フォームを初期状態に戻す
        resetLoginForm();
      });

    return false;
  });

  // ログアウトボタンが押されたらログアウトする
  $(".logout-button").click(function() {
    firebase
      .auth()
      .signOut()
      .catch(function(error) {
        console.error("ログアウトに失敗:", error);
      });
  });

  // 書籍の登録処理
  $("#book-form").submit(function() {
    // 書籍の登録ボタンを押せないようにする
    $("#submit_add_book")
      .attr("disabled", "disabled")
      .text("送信中…");

    // 書籍タイトル
    var bookTitle = $("#add-book-title").val();

    var $bookImage = $("#add-book-image");
    var files = $bookImage[0].files;

    if (files.length === 0) {
      // ファイルが選択されていないなら何もしない
      return false;
    }

    // 表紙画像ファイル
    var file = files[0];

    // 画像ファイル名
    var filename = file.name;

    // 画像ファイルのアップロード先
    var bookImageLocation = "book-images/" + filename;

    firebase
      .storage()
      .ref(bookImageLocation)
      .put(file) // Storageへファイルアップロードを実行
      .then(function() {
        // Storageへのアップロードに成功したら、Realtime Databaseに書籍データを保存する
        var bookData = {
          bookTitle: bookTitle,
          bookImageLocation: bookImageLocation,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        return firebase
          .database()
          .ref("books")
          .push(bookData);
      })
      .then(function() {
        // 書籍一覧画面の書籍の登録モーダルを閉じて、初期状態に戻す
        resetAddBookModal();
      })
      .catch(function(error) {
        // 失敗したとき
        console.error("エラー", error);
      });

    return false;
  });
});
