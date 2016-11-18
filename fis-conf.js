fis.config.merge({
	smdeps: {
		file:[ 
			'index.html'
		],
		dir: [
			'css','js'
		]
	}
});

fis.match('*.scss',{
	rExt: '.css',
	parser: fis.plugin('node-sass')
})

fis.match('*.tmpl',{
	rExt: '.js',
	parser: fis.plugin('utc')
});

fis.match('*.scss',{
	postprocessor: fis.plugin("autoprefixer",{
		"browsers": ['Firfox>=20','Safari>=6','Explorer>=9','Chrome>=12','ChromeAndroid>=4.0'],
		"flexboxfixer": true,
		"gradientfixer":true
	})
})