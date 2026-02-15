package com.altsendme.android

import android.content.Intent
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import com.altsendme.plugin.native_utils.NativeUtils

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)

    NativeUtils.getInstance()?.get()?.handleResult(requestCode, resultCode, data)
  }
}
